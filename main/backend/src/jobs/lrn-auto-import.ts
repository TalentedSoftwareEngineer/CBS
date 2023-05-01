import {CronJob, cronJob} from "@loopback/cron";
import shellExec from 'shell-exec'
import {LergHistory, Lerg, LrnNumber} from '../models';
import {CONFIGURATIONS, JOB_STATUS} from '../constants/configurations';
import {repository} from '@loopback/repository';
import {ConfigurationRepository, LergHistoryRepository, LergRepository, LrnNumberRepository} from '../repositories';
import directoryTree from 'directory-tree';
import DataUtils from '../utils/data';
import {LRN_DOWNLOADED_PATH, LRN_SHELL_NAME, LRN_SHELL_PATH, SCP_PASS, SCP_PATH, SCP_SERVER, SCP_USER} from '../config';
import {service} from '@loopback/core';
import {UploadService} from '../services';

@cronJob()
export class LrnAutoImport extends CronJob {

  constructor(
    @repository(LrnNumberRepository) public lrnNumberRepository : LrnNumberRepository,
  ) {
    super({
      name: 'lrn-auto-import',
      onTick: async () => {
        // this.process()
      },
      cronTime: '0 0 1 * * *',
      start: false,
    });
  }

  public async process() {
    console.log("Start LRN Updating-----", new Date().toISOString())

    const result = await shellExec("cd " + LRN_SHELL_PATH + " && ./" + LRN_SHELL_NAME + " ")
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