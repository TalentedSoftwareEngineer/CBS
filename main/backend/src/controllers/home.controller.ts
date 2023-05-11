// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {
  CdrHistoryRepository,
  CdrServerRepository,
  ConfigurationRepository,
  LergHistoryRepository,
  LergRepository,
} from '../repositories';
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
import {BillingService, CdrService, FtpService, RoleService} from '../services';
import DataUtils from '../utils/data';
import * as fs from "fs";
import {Lerg, LergHistory} from '../models';
import shellExec from 'shell-exec';
import {
  LRN_DOWNLOADED_HOME,
  LRN_DOWNLOADED_PATH,
  LRN_SHELL_NAME,
  LRN_SHELL_PATH,
  SCP_PASS,
  SCP_PATH,
  SCP_SERVER,
  SCP_USER
} from '../config';
import directoryTree from 'directory-tree';

export class HomeController {
  constructor(
    @repository(ConfigurationRepository) public configurationRepository : ConfigurationRepository,
    @repository(LergRepository) public lergRepository : LergRepository,
    @repository(LergHistoryRepository) public historyRepository : LergHistoryRepository,
    @service(CdrService) public cdrService : CdrService,
    @service(BillingService) public billingService : BillingService,
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

  @post('/test', {
    description: 'test',
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
  async test(
  ) {
    while (true) {
      // 1682866800, 1680274800
      const cdrs: any = await this.cdrService.execute(" select * from cdr_log where StartTime>1680274800 and LRN is null limit 100")
      if (cdrs==null || cdrs.length==0)
        return { success: true }

      for (let item of cdrs) {
        let did = item.Calling
        const num = item.Calling.replace(/-/g, '')
        if (num.length>0 && num.substring(0,1)=="+") {
          if (num.length==12 && num.substring(1,2)=="1")
            did = num.substring(2)
        } else if (num.length==10) {
        } else if (num.length==11 && num.substring(0,1)=="1")
          did = num.substring(1)

        const LRN = await this.cdrService.getLRN(did)
        if (LRN!="") {
          await this.cdrService.execute("update cdr_log set LRN='"+LRN+"' where `id`='"+item.id+"' ")
        }
      }

      console.log("Processing....")
      await DataUtils.sleep(3000)

      if (cdrs.length<100)
        return { success: true, message: 'less than 100' }
    }
  }


  @post('/test_statement', {
    description: 'test',
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
  async test_statement(
  ) {
  }
}
