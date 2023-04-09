import {injectable, /* inject, */ BindingScope, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {CdrHistoryRepository, CdrServerRepository, ConfigurationRepository} from '../repositories';
import {CdrHistory, CdrServer} from '../models';
import {CONFIGURATIONS, JOB_STATUS} from '../constants/configurations';
import {FtpService} from './ftp.service';
import DataUtils from '../utils/data';
import shellExec from 'shell-exec';

@injectable({scope: BindingScope.TRANSIENT})
export class CdrService {
  constructor(
    @repository(ConfigurationRepository) public configurationRepository : ConfigurationRepository,
    @repository(CdrServerRepository) public cdrServerRepository : CdrServerRepository,
    @repository(CdrHistoryRepository) public cdrHistoryRepository : CdrHistoryRepository,
    @service(FtpService) public ftpService : FtpService,
  ) {}

  async getActiveServers() {
    return await this.cdrServerRepository.find({where: {is_active: true}})
  }

  async isStillRunning(id: number) {
    const history = await this.cdrHistoryRepository.findOne({where: {and: [{server_id: id}, {or: [{status: JOB_STATUS.IMPORTING}, {status: JOB_STATUS.DOWNLOADING}, {status: JOB_STATUS.IN_PROGRESS}]}]}, order: ["filename desc"]})
    if (history)
      return true
    return false
  }

  async getLastHistory(id: number) {
    const history = await this.cdrHistoryRepository.findOne({where: {and: [{server_id: id}, {status: JOB_STATUS.SUCCESS}]}, order: ["filename desc"]})
    if (history)
      return history
    return null
  }

  async saveServerHistory(server_id: number, filename?: string, status?: string, message?: string, id?: string) {
    let isNew = false
    let history
    if (id!=undefined) {
      history = await this.cdrHistoryRepository.findById(id)
    } else {
      isNew = true
      history = new CdrHistory()
      history.server_id = server_id
      history.created_at = new Date().toISOString()
    }

    if (filename)
      history.filename = filename
    history.status = status!

    if (message)
      history.message = message

    history.updated_at = new Date().toISOString()

    return isNew ? this.cdrHistoryRepository.create(history) : this.cdrHistoryRepository.save(history)
  }

  async create(server: CdrServer) {
    try {
      await this.cdrHistoryRepository.execute("create table `" + server.table_name + "` ( `id` varchar(64) NOT NULL, `created_at` varchar(255) NULL, PRIMARY KEY(`id`)) ")
    } catch (err) {
      // console.log(err)
    }
  }

  async alter(server: CdrServer, item: any) {
    Object.keys(item).forEach(async (name: string) => {
      try {
        await this.cdrHistoryRepository.execute("alter table `" + server.table_name + "` add  `" + name + "` varchar(255) NULL")
      } catch (err) {
        // console.log(err)
      }
    })
  }

  async insert(server: CdrServer, item: any) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    try {
      let fields = "`id`,`created_at`", values="'"+id+"'" + ",'" + new Date().toISOString() + "'"
      Object.keys(item).forEach((name: string) => {
        if (item[name]!=null) {
          // if (fields!="")
            fields+=","
          fields += "`" + name + "`"

          // if (values!="")
            values+=","
          values += "'" + item[name] + "'"
        }
      })

      let sql = "insert into `" + server.table_name + "` (" + fields + ") values (" + values + ")"
      await this.cdrHistoryRepository.execute(sql)
    } catch (err) {
      console.log(err)
    }
  }

  async import(server: CdrServer, files: any[]) {
    const CDR_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.CDR_HOME);

    for (let file of files) {
      const history = await this.saveServerHistory(server.id!, file.name, JOB_STATUS.DOWNLOADING)

      const fs = require('fs')
      if (fs.existsSync(CDR_HOME + "/" + server.table_name + "/" + file.name)) {
        console.log(server.name + + " > " + file + " is already downloaded.")
        await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, file + " is already downloaded.", history.id)
        continue
      }

      const downloadResult = await this.ftpService.download(server, file.name, CDR_HOME)
      if (!downloadResult.success) {
        console.log(server.name + + " > " + file + " is not downloaded.")
        await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, file + " is not downloaded.", history.id)
        continue
      }

      await DataUtils.sleep(100)

      await this.unzip(CDR_HOME + "/" + server.table_name + "/" + file.name)
      const log_file = file.name.replace(".gz", "")

      console.log(server.name + " > " + log_file + " is generated....")

      await this.saveServerHistory(server.id!, file.name, JOB_STATUS.IMPORTING, log_file + " is generated....",  history.id)
      // TODO - importing
      let content = ""
      try {
        const buffer = fs.readFileSync(CDR_HOME + "/" + server.table_name + "/" + log_file)
        content = buffer.toString()
      } catch (err) {
        console.log(server.name + " > " + log_file + " has error to read....")
        await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, log_file + " has error to read....", history.id)
        return
      }

      if (content!="") {
        // console.log(content)
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

        for (let item of items) {
          await this.alter(server, item)
        }

        await DataUtils.sleep(1000)

        for (let item of items) {
          if (item.SessionId==null || item.SessionId=="") {

          } else {
            await this.insert(server, item)
          }
        }
      }

      // TODO - remove log file
      await DataUtils.sleep(100)
      await this.delete(CDR_HOME + "/" + server.table_name + "/" + log_file)

      await this.saveServerHistory(server.id!, undefined, JOB_STATUS.SUCCESS, "Successfully imported", history.id)
      await DataUtils.sleep(100)
    }
  }

  private async unzip(filename: string) {
    await shellExec("sudo gzip -dk " + filename)
  }

  private async delete(filename: string) {
    await shellExec("sudo rm -rf " + filename)
  }

}
