import {CronJob, cronJob} from "@loopback/cron";
import {repository} from '@loopback/repository';
import {LergRepository} from '../repositories';
import {service} from '@loopback/core';
import {CdrService, FtpService} from '../services';
import DataUtils from '../utils/data';
import {JOB_STATUS} from '../constants/configurations';

@cronJob()
export class CdrMissingImport extends CronJob {

  constructor(
    @service(CdrService) public cdrService : CdrService,
    @service(FtpService) public ftpService : FtpService,
  ) {
    super({
      name: 'cdr-missing-import',
      onTick: async () => {
        this.process()
      },
      cronTime: '0 0 1 * * *',
      start: false,
    });
  }

  public async process() {
    console.log("Start CDR Missing Importing-----", new Date().toISOString())

    const servers = await this.cdrService.getActiveServers()
    if (!servers) {
      console.log("No Active CDR Servers")
      return
    }

    for (let server of servers) {
      if (Date.parse(server.start_date) < new Date().getTime()) {
        // started already
        console.log(server.name + " is starting...")

        // await this.cdrService.create(server)

        const listResult = await this.ftpService.list(server)
        if (listResult.success==false) {
          console.log(server.name + " > " + listResult.message)
          continue
        }

        listResult.result.sort((a: any, b: any) => a.name < b.name ? -1 : 1)

        // let is_running = await this.cdrService.isStillRunning(server.id!)
        // if (is_running) {
        //   console.log(server.name + " is under processing....")
        //   continue
        // }

        const list: any[] = []
        for (const item of listResult.result) {
          if (item.name.startsWith("cdr") && item.name.endsWith("log.gz")) {
            if (server.start_date && server.start_date!="") {
              let dt = item.name.replace("cdr_", "").replace(".log.gz", "").replace("_", "").replace(/-/g, "")
              dt = dt.substring(0,4) +"-" + dt.substring(4,6)+ "-" + dt.substring(6,8) + " " + dt.substring(8,10) + ":" + dt.substring(10, 12) + ":" + dt.substring(12, 14)

              if (Date.parse(dt)<Date.parse(server.start_date)) {

              } else {
                const history = await this.cdrService.getHistory(server.id!, item.name)
                if (history) {

                } else {
                  list.push(item)
                }
              }
            }
          }
        }

        if (list.length==0) {
          console.log("No List to import")
          continue
        }

        this.cdrService.import(server, list)
      }
    }
  }
}