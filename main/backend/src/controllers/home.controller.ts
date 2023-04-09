// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {CdrServerRepository, ConfigurationRepository, LergHistoryRepository, LergRepository} from '../repositories';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response, HttpErrors,
} from '@loopback/rest';
import {repository} from '@loopback/repository';
import {CONFIGURATIONS, JOB_STATUS} from '../constants/configurations';
import {service} from '@loopback/core';
import {CdrService, FtpService, RoleService} from '../services';
import DataUtils from '../utils/data';
import * as fs from "fs";

export class HomeController {
  constructor(
    @repository(ConfigurationRepository) public configurationRepository : ConfigurationRepository,
    @repository(LergRepository) public lergRepository : LergRepository,
    @repository(LergHistoryRepository) public historyRepository : LergHistoryRepository,
    @service(CdrService) public cdrService : CdrService,
    @service(FtpService) public ftpService : FtpService,
  ) {}

  @get('/configurations/initSettings', {
    description: 'Get Banner',
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: {
              type: "object",
            },
          },
        }
      }
    }
  })
  async initSettings(
  ): Promise<any> {
    const banner = await this.configurationRepository.findById(CONFIGURATIONS.BANNER);
    const logo = await this.configurationRepository.findById(CONFIGURATIONS.LOGO);
    return { banner: banner.value, logo: logo.value };
  }

  @get('/configurations/test', {
    description: 'Get Banner',
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: {
              type: "object",
            },
          },
        }
      }
    }
  })
  async test(
  ): Promise<any> {
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
        return
      }
    }
  }

  @post('/test/import', {
    description: 'Import Number',
    responses: {
      '200': {
        description: 'NSRRequest ID',
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {
                req_id: {
                  type: "string"
                }
              }
            }
          }
        },
      }
    }
  })
    async import() {
      const buffer = fs.readFileSync('c:/tmp/PROSBC2TPA2/cdr_2022-12-13_06-30-00.log')
      let content = buffer.toString()
      let items: any = content.split('\n');
      items = items.map((item: string)=>{
        let row: any = {};
        row['StatusType'] = item.split(',')[1];

        let properties: any[] = item.split(',').filter(dd=>dd.includes('='));
        properties.forEach(aa=>{
          row[aa.split('=')[0].replaceAll(":","_")] = aa.split('=')[1].replaceAll("'", "").replaceAll("\r", "").trim();
        });

        if (row["StatusType"]?.toString() == "BEG")
        {
            row["TerminationSource_BEG"] = row['TerminationSource'];
            if (row["Direction"]?.toString() == "originate")
            {
                row["Datetime1"] = item.split(',')[0].split('.')[0];
            }
            else if (row["Direction"]?.toString() == "answer")
            {
                row["Datetime2"] = item.split(',')[0].split('.')[0];
            }
        }
        else if (row["StatusType"]?.toString() == "END")
        {
            row["TerminationSource_END"] = row['TerminationSource'];
            if (row["Direction"]?.toString() == "originate")
            {
                row["Datetime3"] = item.split(',')[0].split('.')[0];
            }
            else if (row["Direction"]?.toString() == "answer")
            {
                row["Datetime4"] = item.split(',')[0].split('.')[0];
            }
        }
        return row;
      });


      const servers = await this.cdrService.getActiveServers()
      if (!servers) {
        console.log("No Active CDR Servers")
        return
      }

      for (let server of servers) {
        await this.cdrService.create(server)

        await DataUtils.sleep(1000)

        for (let item of items) {
          await this.cdrService.alter(server, item)
        }

        await DataUtils.sleep(1000)

        for (let item of items) {
          await this.cdrService.insert(server, item)
        }

        return
      }

    }
}
