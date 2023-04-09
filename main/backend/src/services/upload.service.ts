import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import DataUtils from '../utils/data';
import {HttpErrors} from '@loopback/rest';
import {MESSAGES} from '../constants/messages';
import * as fs from "fs";
import {UPLOAD_METHOD} from '../constants/configurations';
import {BulkUpload, CustomerRate, VendorRate} from '../models';
import {repository} from '@loopback/repository';
import {CustomerRateRepository, VendorRateRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class UploadService {
  constructor(
    @repository(CustomerRateRepository) protected customerRateRepository: CustomerRateRepository,
    @repository(VendorRateRepository) protected vendorRateRepository: VendorRateRepository,
  ) {}

  async readVendorRates(id: number, profile: any, upload: BulkUpload, filename: string, defaults: any) {
    return new Promise(async (resolve) => {
      const csv = require('fast-csv')

      let completed = 0, failed = 0
      let message: string = ""
      let header = ["","","","","","","","","","","","","","","","","","",""]

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', async (data: any) => {
          let npanxx = data[0]
          let lata = data[1]
          let ocn = data[2]
          let state = data[3]
          let ocn_name = data[4]
          let category = data[5]
          let rate = data[6]

          if (npanxx==null || npanxx=="" || isNaN(npanxx)) {
            const err = "NpaNxx is a mandatory field."
            if (!message.includes(err))
              message += err + "\n"
            failed++
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
        })
        .on('end', async () => {
        })
        .on('close', async()=> {
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
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

      fs.createReadStream(filename)
        .pipe(csv.parse({ delimiter: ",", headers: false }))
        .on('data', async (data: any) => {
          let prefix = data[0]
          let destination = data[1]
          let inter_rate = data[2]
          let intra_rate = data[3]
          let init_duration = data[4]
          let succ_duration = data[5]

          if (prefix==null || prefix=="" || destination==null || destination=="") {
            const err = "Prefix, Destination is a mandatory field."
            if (!message.includes(err))
              message += err + "\n"
            failed++
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
        })
        .on('end', async () => {
        })
        .on('close', async()=> {
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
        .on('error', async (err: any) => {
          // remove uploaded file
          try {
            fs.unlink(filename, ()=>{})
          } catch (err) {}

          resolve({ completed, failed, message })
        })
    });
  }
}
