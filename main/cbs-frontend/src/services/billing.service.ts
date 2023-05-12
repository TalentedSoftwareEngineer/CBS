import {injectable, /* inject, */ BindingScope, service} from '@loopback/core';
import {repository} from "@loopback/repository";
import {
  CustomerRateRepository,
  CustomerRepository,
  CustomerResourceGroupRepository,
  TfnNumberRepository,
  VendorRateRepository
} from "../repositories";
import {HttpErrors} from "@loopback/rest";
import {USER_TYPE} from "../constants/configurations";
import {CdrService} from "./cdr.service";

@injectable({scope: BindingScope.TRANSIENT})
export class BillingService {
  constructor(
      @repository(CustomerRepository) public customerRepository : CustomerRepository,
      @repository(TfnNumberRepository) public tfnNumberRepository : TfnNumberRepository,
      @repository(CustomerResourceGroupRepository) public customerResourceGroupRepository : CustomerResourceGroupRepository,
      @repository(CustomerRateRepository) public customerRateRepository : CustomerRateRepository,
      @repository(VendorRateRepository) public vendorRateRepository : VendorRateRepository,
      @service(CdrService) public cdrService : CdrService,
  ) {}

  async updateAutoStatement(req: any) {
    let cnt = 0
    for (let item of req) {
      try {
        await this.customerRepository.updateById(item.customer_id, {auto_statement: item.auto_statement})
        cnt ++
      } catch (err) {
        console.log("Update auto statement error", err)
      }
    }

    return {count: cnt}
  }

  async calculateRateDeck(customer_id: number, server_id: string, start_at: number, end_at: number) {
    const customer = await this.customerRepository.findById(customer_id)
    if (!customer)
      throw new HttpErrors.BadRequest("Invalid Customer");

    // get cdr by period, server
    let sql = " select `log`.`StartTime`, `log`.`EndTime`, `log`.`Duration`, `log`.`Calling`, `log`.`Called`, `log`.`LRN` " +
        " from `cdr_log` as `log` " +
        " where ( `log`.`StartTime` between " + start_at + " and " + end_at + " ) and (`log`.`Duration` is not null and `log`.`Duration`>0) ";

    if (server_id!="")
      sql += " and `log`.`ServerId`=" + server_id + " "

    // get tfn numbers for outbound, get naps for inbound
    if (customer.type==USER_TYPE.CUSTOMER) {  // customer
      const nums: string[] = []
      const numbers = await this.tfnNumberRepository.find({ where: {customer_id: customer_id}, fields: ['tfn_num']})
      if (numbers==null || numbers.length==0)
        throw new HttpErrors.BadRequest("Customer have not TFN Numbers.");

      numbers.forEach((item: any) => {
        let n = item.tfn_num.trim()
        if (n.length==12 && n.substring(0,1)=="+")
          n = n.substring(2)
        else if (n.length==11 && n.substring(0,1)=="1")
          n = n.substring(1)
        else if (n.length>=10)
          n = n.substring(n.length-10)
        else {
          n = ""
        }

        if (n!="") {
          nums.push("'" + n + "'")
          nums.push("'" + "+1"+n + "'")
          nums.push("'" + "1"+n + "'")
        }
      })

      sql += " and `log`.`Called` in (" + nums.join(",") + ")"
    }
    else { // vendor
      const naps: string[] = []
      const rg = await this.customerResourceGroupRepository.find({ where: {and: [{customer_id: customer_id}, {active: true}]}, fields: ['rgid']})
      if (rg==null || rg.length==0)
        throw new HttpErrors.BadRequest("Vendor have not Active NAPs.");

      rg.forEach(item => {
        naps.push("'" + item.rgid + "'")
      })

      sql += " and `log`.`NAP_Originate` in (" + naps.join(",") + ")"
    }

    // console.log(sql)
    // get cdr logs linked with customer
    let cdr: any = await this.cdrService.execute(sql)
    if (cdr==null || cdr.length==0)
      throw new HttpErrors.BadRequest("No CDR Logs");

    // apply default rate, duration
    let npanxx: string[] = []
    cdr = cdr.map((item: any) => {
      let res = { ...item,
        npanxx: '',
        inter_rate: customer.default_rate, intra_rate: customer.default_rate,
        init_duration: customer.init_duration, succ_duration: customer.succ_duration,
        cost: 0,
      }

      if (item.LRN!=null && item.LRN!="") {
        res.npanxx = item.LRN.substring(0, 6)
      } else {
        let num = item.Calling.replace(/-/g, '')
        // num = item.Calling.replace(/-/g, '')
        if (num.length>0 && num.substring(0,1)=="+") {
          if (num.length==12 && num.substring(1,2)=="1")
            res.npanxx = num.substring(2, 8)
        } else if (num.length==10) {
          res.npanxx = num.substring(0, 6)
        } else if (num.length==11 && num.substring(0,1)=="1")
          res.npanxx = num.substring(1, 7)
      }

      if (res.npanxx!="" && !npanxx.includes(res.npanxx))
        npanxx.push(res.npanxx)

      return res
    })

    if (npanxx.length>0) {
      // get customer or vendor rates
      let rates: any[]|null = null
      if (customer.type==USER_TYPE.CUSTOMER)
        rates = await this.customerRateRepository.find({ where: {and: [ {customer_id: customer_id}, {prefix: {inq: npanxx}} ]}, fields: ['prefix', 'inter_rate', 'intra_rate', 'init_duration', 'succ_duration']})
      else
        rates = await this.vendorRateRepository.find({ where: {and: [ {customer_id: customer_id}, {npanxx: {inq: npanxx}} ]}, fields: ['npanxx', 'inter_rate', 'intra_rate', 'init_duration', 'succ_duration']})

      if (rates!=null && rates.length>0) {
        cdr = cdr.map((item: any) => {
          // @ts-ignore
          const rate = rates.find((row: any) => row.prefix!=null && row.prefix==item.npanxx || row.npanxx!=null && row.npanxx==item.npanxx)
          if (rate!=null) {
            item.inter_rate = rate.inter_rate
            item.intra_rate = rate.intra_rate
            item.init_duration = rate.init_duration
            item.succ_duration = rate.succ_duration
          }

          return item
        })
      }
    }

    let total_duration = 0, total_cost = 0
    cdr = cdr.map((item: any) => {
      const duration = Number(item.Duration)
      // TODO - consider inter/intra rate
      item.cost = duration%item.succ_duration==0 ? item.inter_rate * duration/item.succ_duration : item.inter_rate * (Math.floor(duration/item.succ_duration) + 1)
      item.cost = Number(item.cost.toFixed(3))

      total_duration += duration
      total_cost += item.cost

      return item
    })

    return {
      stats: {
        calls: cdr.length,
        duration: total_duration,
        cost: Number(total_cost.toFixed(6)),
      },
      logs: cdr
    }
  }

}
