import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import DataUtils from '../utils/data';
import {HttpErrors} from '@loopback/rest';
import {MESSAGES} from '../constants/messages';
import * as fs from "fs";
import {UPLOAD_METHOD, USER_TYPE} from '../constants/configurations';
import {BulkUpload, CustomerRate, CustomerResourceGroup, Lerg, TfnNumber, VendorRate} from '../models';
import {repository} from '@loopback/repository';
import {
  CustomerRateRepository,
  CustomerRepository,
  CustomerResourceGroupRepository, LergRepository,
  TfnNumberRepository,
  VendorRateRepository,
} from '../repositories';
import {fail} from 'assert';

@injectable({scope: BindingScope.TRANSIENT})
export class UploadService {
  constructor(
    @repository(CustomerRepository) protected customerRepository: CustomerRepository,
    @repository(CustomerRateRepository) protected customerRateRepository: CustomerRateRepository,
    @repository(CustomerResourceGroupRepository) protected customerResourceGroupRepository: CustomerResourceGroupRepository,
    @repository(VendorRateRepository) protected vendorRateRepository: VendorRateRepository,
    @repository(TfnNumberRepository) public tfnNumberRepository : TfnNumberRepository,
    @repository(LergRepository) public lergRepository : LergRepository,
  ) {}

  async readVendorRates(id: number, profile: any, upload: BulkUpload, filename: string, defaults: any) {
    return new Promise(async (resolve) => {
      const csv = require('fast-csv')

      let completed = 0, failed = 0
      let message: string = ""
      let header = ["","","","","","","","","","","","","","","","","","",""]
      let promises: any[] = []

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', (data: any) => {
          const promise = new Promise(async (resolve1) => {
            let npanxx = data.length>0 ? data[0] : ''
            let lata = data.length>1 ? data[1] : ''
            let ocn = data.length>2 ? data[2] : ''
            let state = data.length>3 ? data[3] : ''
            let ocn_name = data.length>4 ? data[4] : ''
            let category = data.length>5 ? data[5] : ''
            let rate = data.length>6 ? data[6] : ''

            if (npanxx==null || npanxx=="" || isNaN(npanxx)) {
              const err = "NpaNxx is a mandatory field."
              if (!message.includes(err))
                message += err + "\n"
              failed++
              resolve1({})
              return
            }

            let inter_rate = defaults.default_rate
            let intra_rate = defaults.default_rate
            let init_duration = defaults.init_duration
            let succ_duration = defaults.succ_duration

            // initialize with default rates
            if (rate!=null && rate!="" && !isNaN(rate)) {
              inter_rate = rate
              intra_rate = rate
            }

            try {
              let rates = await this.vendorRateRepository.findOne({where: {and: [ {customer_id: id, npanxx: npanxx} ]}})
              if (rates) {
                if (upload.method==UPLOAD_METHOD.APPEND) {
                  const err = "Inter/Intra Rates have already existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                }
                else if (upload.method==UPLOAD_METHOD.UPDATE) {
                  if (lata!=null && lata!="")
                    rates.lata = lata

                  if (ocn!=null && ocn!="")
                    rates.ocn = ocn

                  if (state!=null && state!="")
                    rates.state = state

                  if (ocn_name!=null && ocn_name!="")
                    rates.ocn_name = ocn_name

                  if (category!=null && category!="")
                    rates.category = category

                  rates.intra_rate = intra_rate!
                  rates.inter_rate = inter_rate!
                  rates.init_duration = init_duration!
                  rates.succ_duration = succ_duration!

                  rates.updated_by = profile.user.id
                  rates.updated_at = new Date().toISOString()

                  this.vendorRateRepository.save(rates)
                  completed++
                }
                else if (upload.method==UPLOAD_METHOD.DELETE) {
                  this.vendorRateRepository.deleteById(rates.id)
                  completed++
                }
              }
              else {
                if (upload.method==UPLOAD_METHOD.DELETE) {
                  const err = "Inter/Intra Rates have not existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                } else {
                  rates = new VendorRate()
                  rates.customer_id = id!
                  rates.npanxx = npanxx

                  if (lata!=null && lata!="")
                    rates.lata = lata

                  if (ocn!=null && ocn!="")
                    rates.ocn = ocn

                  if (state!=null && state!="")
                    rates.state = state

                  if (ocn_name!=null && ocn_name!="")
                    rates.ocn_name = ocn_name

                  if (category!=null && category!="")
                    rates.category = category

                  rates.intra_rate = intra_rate!
                  rates.inter_rate = inter_rate!
                  rates.init_duration = init_duration!
                  rates.succ_duration = succ_duration!

                  rates.created_by = profile.user.id
                  rates.created_at = new Date().toISOString()
                  rates.updated_by = profile.user.id
                  rates.updated_at = new Date().toISOString()

                  this.vendorRateRepository.create(rates)
                  completed++
                }
              }
            } catch (err1) {
              const err = err1.message
              if (!message.includes(err))
                message += err + "\n"
              failed++
            }

            resolve1({})
          })

          promises.push(promise)
        })
        .on('end', () => {
        })
        .on('close', async()=> {
          await Promise.all(promises)

          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
          if (!message.includes(err?.message))
            message += err?.message + "\n"

          // remove uploaded file
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
    });
  }

  async readCustomerRates(id: number, profile: any, upload: BulkUpload, filename: string, defaults: any) {
    return new Promise(async (resolve) => {
      const csv = require('fast-csv')

      let completed = 0, failed = 0
      let message: string = ""
      let header = ["","","","","","","","","","","","","","","","","","",""]
      let promises: any[] = []

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', (data: any) => {
          const promise = new Promise(async (resolve1) => {
            let prefix = data.length>0 ? data[0] : ''
            let destination = data.length>1 ? data[1] : ''
            let inter_rate = data.length>2 ? data[2] : ''
            let intra_rate = data.length>3 ? data[3] : ''
            let init_duration = data.length>4 ? data[4] : ''
            let succ_duration = data.length>5 ? data[5] : ''

            if (prefix==null || prefix=="" || destination==null || destination=="") {
              const err = "Prefix, Destination is a mandatory field."
              if (!message.includes(err))
                message += err + "\n"
              failed++
              resolve1({})
              return
            }

            // initialize with default rates
            if (inter_rate==null || inter_rate=="")
              inter_rate = defaults.default_rate
            if (intra_rate==null || intra_rate=="")
              intra_rate = defaults.default_rate
            if (init_duration==null || init_duration=="")
              init_duration = defaults.init_duration
            if (succ_duration==null || succ_duration=="")
              succ_duration = defaults.succ_duration

            try {
              let rates = await this.customerRateRepository.findOne({where: {and: [ {customer_id: id, prefix: prefix} ]}})
              if (rates) {
                if (upload.method==UPLOAD_METHOD.APPEND) {
                  const err = "Inter/Intra Rates have already existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                }
                else if (upload.method==UPLOAD_METHOD.UPDATE) {
                  if (destination!=null && destination!="")
                    rates.destination = destination

                  rates.intra_rate = intra_rate
                  rates.inter_rate = inter_rate
                  rates.init_duration = init_duration
                  rates.succ_duration = succ_duration

                  rates.updated_by = profile.user.id
                  rates.updated_at = new Date().toISOString()

                  await this.customerRateRepository.save(rates)
                  completed++
                }
                else if (upload.method==UPLOAD_METHOD.DELETE) {
                  await this.customerRateRepository.deleteById(rates.id)
                  completed++
                }
              }
              else {
                if (upload.method==UPLOAD_METHOD.DELETE) {
                  const err = "Inter/Intra Rates have not existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                } else {
                  rates = new CustomerRate()
                  rates.customer_id = id!

                  rates.prefix = prefix
                  rates.destination = destination
                  rates.intra_rate = intra_rate
                  rates.inter_rate = inter_rate
                  rates.init_duration = init_duration
                  rates.succ_duration = succ_duration

                  rates.created_by = profile.user.id
                  rates.created_at = new Date().toISOString()
                  rates.updated_by = profile.user.id
                  rates.updated_at = new Date().toISOString()

                  await this.customerRateRepository.create(rates)
                  completed++
                }
              }
            } catch (err1) {
              const err = err1.message
              if (!message.includes(err))
                message += err + "\n"
              failed++
            }

            resolve1({})
          })

          promises.push(promise)
        })
        .on('end', () => {
        })
        .on('close', async()=> {
          await Promise.all(promises)

          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
          if (!message.includes(err?.message))
            message += err?.message + "\n"

          // remove uploaded file
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
    });
  }

  async readCustomerNAP(id: number, profile: any, upload: BulkUpload, filename: string) {
    return new Promise(async (resolve) => {
      const csv = require('fast-csv')

      let completed = 0, failed = 0
      let message: string = ""
      let header = ["","","","","","","","","","","","","","","","","","",""]
      let promises: any[] = []

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', (data: any) => {
          const promise = new Promise(async (resolve1) => {
            let rgid = data.length>0 ? data[0] : ''
            let pid = data.length>1 ? data[1] : ''
            let ip = data.length>2 ? data[2] : ''
            let direction = data.length>3 ? data[3] : ''
            let description = data.length>4 ? data[4] : ''

            if (rgid==null || rgid=="") {
              const err = "NAP ID is a mandatory field."
              if (!message.includes(err))
                message += err + "\n"
              failed++
              resolve1({})
              return
            }

            if (direction==null || direction=="")
              direction = "INBOUND"
            else if (direction.toUpperCase()=="OUTBOUND" || direction.toUpperCase()=="O")
              direction = "OUTBOUND"
            else
              direction = "INBOUND"

            try {
              let rg: any = await this.customerResourceGroupRepository.findOne({where: {rgid: rgid}})
              if (rg) {
                if (upload.method==UPLOAD_METHOD.APPEND || rg.customer_id!=id) {
                  const err = "NAP have already existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                }
                else if (upload.method==UPLOAD_METHOD.UPDATE) {
                  rg.partition_id = pid
                  if (ip!=null && ip!="")
                    rg.ip = ip

                  if (description!=null && description!="")
                    rg.description = description

                  rg.direction = direction
                  rg.active = true

                  rg.updated_by = profile.user.id
                  rg.updated_at = new Date().toISOString()

                  await this.customerResourceGroupRepository.save(rg)
                  completed++
                }
                else if (upload.method==UPLOAD_METHOD.DELETE) {
                  await this.customerResourceGroupRepository.deleteById(rg.id)
                  completed++
                }
              }
              else {
                if (upload.method==UPLOAD_METHOD.DELETE) {
                  const err = "NAP have not existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                }
                else {
                  rg = new CustomerResourceGroup()
                  rg.customer_id = id!
                  rg.rgid = rgid
                  rg.partition_id = pid
                  rg.ip = ip
                  rg.description = description
                  rg.direction = direction
                  rg.active = true

                  rg.created_by = profile.user.id
                  rg.created_at = new Date().toISOString()
                  rg.updated_by = profile.user.id
                  rg.updated_at = new Date().toISOString()

                  await this.customerResourceGroupRepository.create(rg)
                  completed++
                }
              }
            } catch (err1) {
              const err = err1.message
              if (!message.includes(err))
                message += err + "\n"
              failed++
            }

            resolve1({})
          })

          promises.push(promise)
        })
        .on('end', () => {
        })
        .on('close', async()=> {
          await Promise.all(promises)

          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
          if (!message.includes(err?.message))
            message += err?.message + "\n"

          // remove uploaded file
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
    });
  }

  async readVendorNAP(id: number, profile: any, upload: BulkUpload, filename: string) {
    return new Promise(async (resolve) => {
      const csv = require('fast-csv')

      let completed = 0, failed = 0
      let message: string = ""
      let header = ["","","","","","","","","","","","","","","","","","",""]
      let promises: any[] = []

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', (data: any) => {
          const promise = new Promise(async (resolve1) => {
            let rgid = data.length>0 ? data[0] : ''
            let pid = data.length>1 ? data[1] : ''
            let ip = data.length>2 ? data[2] : ''
            let direction = data.length>3 ? data[3] : ''
            let description = data.length>4 ? data[4] : ''

            if (rgid==null || rgid=="" || pid==null || pid=="") {
              const err = "NAP ID, PartitionID is a mandatory field."
              if (!message.includes(err))
                message += err + "\n"
              failed++
              resolve1({})
              return
            }

            if (direction==null || direction=="")
              direction = "INBOUND"
            else if (direction.toUpperCase()=="OUTBOUND" || direction.toUpperCase()=="O")
              direction = "OUTBOUND"
            else
              direction = "INBOUND"

            try {
              let rg: any = await this.customerResourceGroupRepository.findOne({where: {rgid: rgid}})
              if (rg) {
                if (upload.method==UPLOAD_METHOD.APPEND || rg.customer_id!=id) {
                  const err = "NAP have already existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                }
                else if (upload.method==UPLOAD_METHOD.UPDATE) {
                  rg.partition_id = pid
                  if (ip!=null && ip!="")
                    rg.ip = ip

                  if (description!=null && description!="")
                    rg.description = description

                  rg.direction = direction
                  rg.active = true

                  rg.updated_by = profile.user.id
                  rg.updated_at = new Date().toISOString()

                  await this.customerResourceGroupRepository.save(rg)
                  completed++
                }
                else if (upload.method==UPLOAD_METHOD.DELETE) {
                  await this.customerResourceGroupRepository.deleteById(rg.id)
                  completed++
                }
              }
              else {
                if (upload.method==UPLOAD_METHOD.DELETE) {
                  const err = "NAP have not existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                }
                else {
                  rg = new CustomerResourceGroup()
                  rg.customer_id = id!
                  rg.rgid = rgid
                  rg.partition_id = pid
                  rg.ip = ip
                  rg.description = description
                  rg.direction = direction
                  rg.active = true

                  rg.created_by = profile.user.id
                  rg.created_at = new Date().toISOString()
                  rg.updated_by = profile.user.id
                  rg.updated_at = new Date().toISOString()

                  await this.customerResourceGroupRepository.create(rg)
                  completed++
                }
              }
            } catch (err1) {
              const err = err1.message
              if (!message.includes(err))
                message += err + "\n"
              failed++
            }

            resolve1({})
          })

          promises.push(promise)
        })
        .on('end', () => {
        })
        .on('close', async()=> {
          await Promise.all(promises)

          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
          if (!message.includes(err?.message))
            message += err?.message + "\n"

          // remove uploaded file
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
    });
  }

  async readTfnNumbers(profile: any, upload: BulkUpload, filename: string) {
    return new Promise((resolve) => {
      let completed = 0, failed = 0
      let message: string = ""
      let promises: any[] = []

      const csv = require('fast-csv')

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', (data: any) => {
          const promise = new Promise(async (resolve1) => {
            let tfn_num = data.length>0 ? data[0] : ''
            let customer_id = data.length>1 ? data[1] : ''
            let price = data.length>2 ? data[2] : ''
            let resp_org = data.length>3 ? data[3] : ''

            if (tfn_num==null || tfn_num=="") {
              const err = "Tfn Number is a mandatory field."
              if (!message.includes(err))
                message += err + "\n"
              failed+=1
              resolve1({})
              return
            }

            if (customer_id==null || customer_id=="")
              customer_id = undefined
            else {
              const customer = await this.customerRepository.findOne({where: {and: [ {type: USER_TYPE.CUSTOMER}, {company_id: customer_id} ]}})
              if (customer)
                customer_id = customer?.id
              else
                customer_id = undefined
            }

            if (price==null || price=="" || isNaN(price))
              price = 0.0
            else
              price = Number(price)

            try {
              let tfn = await this.tfnNumberRepository.findOne({where: { tfn_num: tfn_num }})
              if (tfn) {
                if (upload.method==UPLOAD_METHOD.APPEND) {
                  const err = "TFN Number have already existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed+=1
                }
                else if (upload.method==UPLOAD_METHOD.UPDATE) {
                  if (customer_id!=undefined)
                    tfn.customer_id = customer_id

                  if (price!=0)
                    tfn.price = price

                  if (resp_org!="")
                    tfn.resp_org = resp_org

                  tfn.updated_by = profile.user.id
                  tfn.updated_at = new Date().toISOString()

                  await this.tfnNumberRepository.save(tfn)
                  completed+=1
                }
                else if (upload.method==UPLOAD_METHOD.DELETE) {
                  await this.tfnNumberRepository.deleteById(tfn.id)
                  completed+=1
                }
              }
              else {
                if (upload.method==UPLOAD_METHOD.DELETE) {
                  const err = "TFN Number have not existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed+=1
                }
                else {
                  tfn = new TfnNumber()
                  tfn.tfn_num = tfn_num
                  tfn.customer_id = customer_id
                  tfn.price = price
                  tfn.resp_org = resp_org

                  tfn.created_by = profile.user.id
                  tfn.created_at = new Date().toISOString()
                  tfn.updated_by = profile.user.id
                  tfn.updated_at = new Date().toISOString()

                  await this.tfnNumberRepository.create(tfn)
                  completed+=1
                }
              }
            } catch (err1) {
              const err = err1.message
              if (!message.includes(err))
                message += err + "\n"
              failed++
            }

            resolve1({})
          })
          promises.push(promise)
        })
        .on('end', async () => {
        })
        .on('close', async()=> {
          await Promise.all(promises)

          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
          if (!message.includes(err?.message))
            message += err?.message + "\n"

          // remove uploaded file
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
    });
  }

  async readLerg(profile: any, upload: BulkUpload, filename: string) {
    return new Promise((resolve) => {
      let completed = 0, failed = 0
      let message: string = ""
      let promises: any[] = []

      const csv = require('fast-csv')

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', (data: any) => {
          const promise = new Promise(async (resolve1) => {
            let npanxx = data.length>0 ? data[0] : ''
            let lata = data.length>1 ? data[1] : ''
            let ocn = data.length>2 ? data[2] : ''
            let ocn_name = data.length>3 ? data[3] : ''
            let abbre = data.length>4 ? data[4] : ''
            let state = data.length>5 ? data[5] : ''
            let category = data.length>6 ? data[6] : ''
            let rate = data.length>7 ? data[7] : ''
            let note = data.length>8 ? data[8] : ''

            if (npanxx==null || npanxx=="" || lata==null || lata=="" || ocn==null || ocn=="") {
              const err = "NpaNxx, LATA, OCN is a mandatory field."
              if (!message.includes(err))
                message += err + "\n"
              failed++
              resolve1({})
              return
            }

            // initialize with default rates
            if (rate==null || rate=="")
              rate = 0.0
            else
              rate = Number(rate)

            try {
              let lerg = await this.lergRepository.findOne({where: {and: [{npanxx: npanxx}, {thousand: ''}]}})
              if (lerg) {
                if (upload.method==UPLOAD_METHOD.APPEND) {
                  const err = "NpaNxx have already existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                }
                else if (upload.method==UPLOAD_METHOD.UPDATE) {
                  lerg.lata = lata
                  lata.thousand = ""

                  lerg.ocn = ocn
                  if (ocn_name!=null && ocn_name!="")
                    lerg.ocn_name = ocn_name

                  if (state!=null && state!="")
                    lerg.state = state
                  if (abbre!=null && abbre!="")
                    lerg.abbre = abbre
                  if (category!=null && category!="")
                    lerg.category = category

                  if (rate>=0)
                    lerg.rate = rate

                  if (note!=null && note!="")
                    lerg.note = note

                  lerg.updated_at = new Date().toISOString()

                  await this.lergRepository.save(lerg)
                  completed++
                }
                else if (upload.method==UPLOAD_METHOD.DELETE) {
                  await this.lergRepository.deleteById(lerg.id)
                  completed++
                }
              }
              else {
                if (upload.method==UPLOAD_METHOD.DELETE) {
                  const err = "NpaNxx have not existed."
                  if (!message.includes(err))
                    message += err + "\n"
                  failed++
                } else {
                  lerg = new Lerg()
                  lerg.npanxx = npanxx
                  lerg.thousand = ""
                  lerg.lata = lata
                  lerg.ocn = ocn
                  lerg.ocn_name = ocn_name
                  lerg.state = state
                  lerg.abbre = abbre
                  lerg.category = category
                  lerg.rate = rate
                  lerg.note = note

                  lerg.created_at = new Date().toISOString()
                  lerg.updated_at = new Date().toISOString()

                  await this.lergRepository.create(lerg)
                  completed++
                }
              }
            } catch (err1) {
              const err = err1.message
              if (!message.includes(err))
                message += err + "\n"
              failed++
            }

            resolve1({})
          })
          promises.push(promise)
        })
        .on('end', () => {
        })
        .on('close', async()=> {
          await Promise.all(promises)

          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
          if (!message.includes(err?.message))
            message += err?.message + "\n"

          // remove uploaded file
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
    });
  }
}
