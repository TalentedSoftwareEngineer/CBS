import {CronJob, cronJob} from "@loopback/cron";
import {repository} from '@loopback/repository';
import {LergRepository} from '../repositories';
import {service} from '@loopback/core';
import {CdrService, FtpService} from '../services';
import DataUtils from '../utils/data';
import {JOB_STATUS} from '../constants/configurations';

@cronJob()
export class CdrAutoImport extends CronJob {

  constructor(
    @service(CdrService) public cdrService : CdrService,
    @service(FtpService) public ftpService : FtpService,
  ) {
    super({
      name: 'cdr-auto-import',
      onTick: async () => {
        this.process()
      },
      cronTime: '0 */30 * * * *',
      start: false,
    });
  }

  public async process() {
    console.log("Start CDR Importing-----", new Date().toISOString())

    const servers = await this.cdrService.getActiveServers()
    if (!servers) {
      console.log("No Active CDR Servers")
      return
    }

    for (let server of servers) {
      if (Date.parse(server.start_date) < new Date().getTime()) {
        // started already
        console.log(server.name + " is starting...")

        await this.cdrService.create(server)

        const listResult = await this.ftpService.list(server)
        if (listResult.success==false) {
          console.log(server.name + " > " + listResult.message)
          continue
        }

        let is_running = await this.cdrService.isStillRunning(server.id!)
        if (is_running) {
          console.log(server.name + " is under processing....")
          continue
        }

        let history: any = await this.cdrService.getLastHistory(server.id!)

        const list = listResult.result.filter((item: any) => {
          if (item.name.startsWith("cdr") && item.name.endsWith("log.gz")) {
            if (history == null)
              return true

            if (item.name == history.filename)
              return history.status == JOB_STATUS.FAILED

            if (item.name > history.filename)
              return true
          }

          return false
        })

        if (list.length==0) {
          console.log("No List to import")
          continue
        }

        this.cdrService.import(server, list)
      }
    }
  }
}