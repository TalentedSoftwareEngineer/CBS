import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import DataUtils from '../utils/data';
import {HttpErrors} from '@loopback/rest';
import {MESSAGES} from '../constants/messages';
import * as fs from "fs";
import {UPLOAD_METHOD} from '../constants/configurations';
import {BulkUpload, VendorRate} from '../models';
import {repository} from '@loopback/repository';
import {VendorRateRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class UploadService {
  constructor(
    @repository(VendorRateRepository) protected vendorRateRepository: VendorRateRepository,
  ) {}

  async readVendorRates(id: number, profile: any, upload: BulkUpload, filename: string, defaults: any) {
    return new Promise(async (resolve) => {
      const csv = require('fast-csv')

      let completed = 0, failed = 0
      let message: string = ""
      let header = ["","","","","","","","","","","","","","","","","","",""]

      await fs.createReadStream(filename)
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

          let inter_rate = defaults.rate
          let intra_rate = defaults.rate
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
          // remove uploaded file
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

  async readCustomerRates() {

  }
}