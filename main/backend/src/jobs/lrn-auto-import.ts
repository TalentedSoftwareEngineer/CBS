import {CronJob, cronJob} from "@loopback/cron";
import shellExec from 'shell-exec'
import {CONFIGURATIONS, JOB_STATUS} from '../constants/configurations';
import {repository} from '@loopback/repository';
import directoryTree from 'directory-tree';
import DataUtils from '../utils/data';
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
import {service} from '@loopback/core';
import {UploadService} from '../services';

export class LrnAutoImport {

  // public async process() {
  //   console.log("Start LRN Updating-----", new Date().toISOString())
  //
  //   let result = await shellExec("cd " + LRN_SHELL_PATH + " && ./" + LRN_SHELL_NAME + " ")
  //   if (result.stderr!="") {
  //     // failed to download
  //     console.log("No New LRN File", result)
  //     return
  //   }
  //
  //   let stdout = result.stdout // "lrn23-04-2023.tar.gz\n\nlrn23-04-2023.txt\n" //
  //   let files: string[] = stdout.split("\n")
  //   let gz = "", txt = ""
  //   for (let file of files) {
  //     if (file.endsWith(".tar.gz"))
  //       gz = file
  //     else if (file.endsWith(".txt"))
  //       txt = file
  //   }
  //
  //   // txt = LRN_DOWNLOADED_PATH + "/" + txt
  //   console.log("LRN File: ", txt)
  //
  //   // split --verbose -l100000 lrn28-04-2023.txt lrn.
  //   result = await shellExec("cd " + LRN_DOWNLOADED_PATH + " && split --verbose -l100000000 " + txt + " lrn.")
  //   if (result.stderr!="") {
  //     // failed to download
  //     console.log("Cannot split lrn file", result)
  //     return
  //   }
  //
  //   let split_files: string[] = result.stdout.split("\n")
  //   for (let file of split_files) {
  //     const is = file.indexOf("lrn.")
  //     if (is>-1) {
  //       file = file.substring(is, file.length-1)
  //       await this.importSingleFile(file)
  //     }
  //   }
  //
  //   await shellExec("rm -rf " + LRN_DOWNLOADED_PATH + "/*")
  //   if (gz!="")
  //     await shellExec("rm -rf " + LRN_DOWNLOADED_HOME + "/" + gz)
  // }
  //
  // public async importSingleFile(file: string) {
  //   const fs = require('fs');
  //   const path = LRN_DOWNLOADED_PATH + "/" + file
  //
  //   let content = ""
  //   try {
  //     const buffer = fs.readFileSync(path);
  //     content = buffer.toString()
  //   } catch (err) {
  //     console.log("error to read lrn file", file, err?.message)
  //   }
  //
  //   try {
  //     let lrn: any[] = content.split("\n")
  //     lrn = lrn.map((item: string) => {
  //       const data = item.split(",")
  //       return {
  //         calling: data.length>0 ? data[0] : '',
  //         translated: data.length>1 ? data[1] : '',
  //         lata: data.length>2 ? data[2] : '',
  //         thousand: data.length>3 ? data[3] : '',
  //       }
  //     })
  //
  //     lrn = lrn.filter(item => item.calling!="" && item.translated!="")
  //
  //     await this.lrnNumberRepository.createAll(lrn)
  //   } catch (err) {
  //     console.log("error to import lrn file", file, err.message)
  //   }
  // }

}