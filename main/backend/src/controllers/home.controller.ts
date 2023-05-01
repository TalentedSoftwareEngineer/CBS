// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {
  CdrHistoryRepository,
  CdrServerRepository,
  ConfigurationRepository,
  LergHistoryRepository,
  LergRepository, LrnNumberRepository,
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
import {CdrService, FtpService, RoleService} from '../services';
import DataUtils from '../utils/data';
import * as fs from "fs";
import {Lerg, LergHistory, LrnNumber} from '../models';
import shellExec from 'shell-exec';
import {LRN_DOWNLOADED_PATH, LRN_SHELL_NAME, LRN_SHELL_PATH, SCP_PASS, SCP_PATH, SCP_SERVER, SCP_USER} from '../config';
import directoryTree from 'directory-tree';

export class HomeController {
  constructor(
    @repository(ConfigurationRepository) public configurationRepository : ConfigurationRepository,
    @repository(LergRepository) public lergRepository : LergRepository,
    @repository(LrnNumberRepository) public lrnNumberRepository : LrnNumberRepository,
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
    @param.query.number('days') days: number,
  ) {
    this.process(days)
  }

  public async process(days: number) {
    console.log("Start LRN Updating-----", new Date().toISOString())

    const result = await shellExec("cd " + LRN_SHELL_PATH + " && ./" + LRN_SHELL_NAME + " " + days)
    if (result.stderr!="") {
      // failed to download
      console.log("No New LRN File", result)
      return
    }

    let stdout = result.stdout // "lrn23-04-2023.tar.gz\n\nlrn23-04-2023.txt\n" //
    let files: string[] = stdout.split("\n")
    let gz = "", txt = ""
    for (let file of files) {
      if (file.endsWith(".tar.gz"))
        gz = file
      else if (file.endsWith(".txt"))
        txt = file
    }

    txt = LRN_DOWNLOADED_PATH + "/" + txt
    console.log("LRN File: ", txt)

    try {
      const fs = require('fs');
      const es = require('event-stream')
      const stream = fs.createReadStream(txt)
        .pipe(es.split())
        .pipe(es.mapSync(async (line: string) => {
          stream.pause()

          // console.log("line: " + line)
          const lines = line.split(",")
          const calling = lines.length>0 ? lines[0] : ''
          const translated = lines.length>1 ? lines[1] : ''
          const lata = lines.length>2 ? lines[2] : ''
          const thousand = lines.length>3 ? lines[3] : ''

          if (calling!="" && translated!="") {
            this.update({calling, translated, lata, thousand})
          }

          stream.resume()
        }))
        .on('end', async() => {
          await shellExec("rm -rf " + txt)
          console.log("LRN Update Finished")
        })
    } catch (err) {
      console.log(err)
    }
  }

  async update(data: any) {
    const {calling, translated, lata, thousand} = data
    // let lrn = await this.lrnNumberRepository.findOne({where: {calling: calling}})
    // if (lrn) {
    //   lrn.calling = calling
    //   lrn.translated = translated
    //   lrn.lata = lata
    //   lrn.thousand = thousand
    //   await this.lrnNumberRepository.save(lrn)
    // } else {
    const lrn = new LrnNumber()
    lrn.calling = calling
    lrn.translated = translated
    lrn.lata = lata
    lrn.thousand = thousand

    try {
      await this.lrnNumberRepository.create(lrn)
    } catch (err) {}
    // }
  }

}
