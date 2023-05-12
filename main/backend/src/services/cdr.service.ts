import {injectable, /* inject, */ BindingScope, service} from '@loopback/core';
import {Count, repository} from '@loopback/repository';
import {CdrHistoryRepository, CdrServerRepository, ConfigurationRepository} from '../repositories';
import {CdrHistory, CdrServer} from '../models';
import {CONFIGURATIONS, JOB_STATUS} from '../constants/configurations';
import {FtpService} from './ftp.service';
import DataUtils from '../utils/data';
import shellExec from 'shell-exec';
import {LRN_API_URL, TEMPORARY} from "../config";
import moment from "moment";
import axios from "axios";

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
    // return await this.cdrServerRepository.find({where: {id: 2}})
  }

/*  async getOppositeServer(server: CdrServer) {
    return this.cdrServerRepository.find({where: {and: [
          {is_active: true}, {table_name: server.table_name},
          {id: {neq: server.id}}
    ]}})
  }*/

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

  async getHistory(id: number, filename: string) {
    const history = await this.cdrHistoryRepository.findOne({where: {and: [{server_id: id}, {filename: filename}, {status: JOB_STATUS.SUCCESS}]} })
    return history
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

/*
  async create(server: CdrServer) {
    // create cdr log table
    try {
      await this.cdrHistoryRepository.execute("create table `" + server.table_name + "` ( `id` varchar(64) NOT NULL, `SessionId` varchar(255) NOT NULL, `created_at` varchar(255) NULL, PRIMARY KEY(`id`)) ")
    } catch (err) {
      // console.log(err)
    }

    // create cdr nap table to filter
    try {
      await this.cdrHistoryRepository.execute("create table `" + server.table_name + "_nap` ( `name` varchar(64) NOT NULL, PRIMARY KEY(`name`)) ")
    } catch (err) {
      // console.log(err)
    }

    // TODO - add indexes
    try {
      await this.cdrHistoryRepository.execute(" ALTER TABLE `cdr`.`" + server.table_name + "` ADD UNIQUE `ID_" + server.table_name + "_sessionid` (`SessionId`); ")
    } catch (err) {
      // console.log(err)
    }

    try {
      await this.cdrHistoryRepository.execute(" ALTER TABLE `cdr`.`" + server.table_name + "` ADD INDEX `ID_" + server.table_name + "_called_calling` (`Called`, `Calling`) USING BTREE;")
    } catch (err) {
      // console.log(err)
    }

    try {
      await this.cdrHistoryRepository.execute(" ALTER TABLE `cdr`.`" + server.table_name + "` ADD INDEX `ID_" + server.table_name + "_nap` (`NAP_Originate`, `NAP_Answer`) USING BTREE;")
    } catch (err) {
      // console.log(err)
    }

    try {
      await this.cdrHistoryRepository.execute(" ALTER TABLE `cdr`.`" + server.table_name + "` ADD INDEX `ID_" + server.table_name + "_starttime` (`StartTime`) USING BTREE;")
    } catch (err) {
      // console.log(err)
    }

    try {
      await this.cdrHistoryRepository.execute(" ALTER TABLE `cdr`.`" + server.table_name + "` ADD INDEX `ID_" + server.table_name + "_duration` (`Duration`) USING BTREE;")
    } catch (err) {
      // console.log(err)
    }
  }
*/

  async alter(server: CdrServer, item: any) {
    Object.keys(item).forEach(async (name: string) => {
      try {
        await this.cdrHistoryRepository.execute("alter table `" + "cdr_log" + "` add  `" + name + "` varchar(255) NULL") // server.table_name
      } catch (err) {
        // console.log(err)
      }
    })
  }

  async insert(server: CdrServer, item: any) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    if (item.Calling!=null) {
      let did = item.Calling
      const num = item.Calling.replace(/-/g, '')
      if (num.length>0 && num.substring(0,1)=="+") {
        if (num.length==12 && num.substring(1,2)=="1")
          did = num.substring(2)
      } else if (num.length==10) {
      } else if (num.length==11 && num.substring(0,1)=="1")
        did = num.substring(1)

      item.LRN = await this.getLRN(did)
    }

    try {
      let fields = "`id`,`ServerId`,`created_at`", values="'"+id+"'," + server.id + ",'" + new Date().toISOString() + "'"
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

      let sql = "insert into `" + "cdr_log" + "` (" + fields + ") values (" + values + ")" // server.table_name
      await this.cdrHistoryRepository.execute(sql)
    } catch (err) {
      // console.log(err)
      await this.update(server, item)
    }

    if (item.NAP_Originate!=null && item.NAP_Originate!="")
      await this.addNAP("Originate", item.NAP_Originate)

    if (item.NAP_Answer!=null && item.NAP_Answer!="")
      await this.addNAP("Answer", item.NAP_Answer)
  }

  async addNAP(direction: string, item: string) {
    try {
      let sql = "insert into `"  + "cdr" + "_nap`(`name`,`direction`) values ('" + item + "','" + direction + "')"
      await this.cdrHistoryRepository.execute(sql)
    } catch (err) {}
  }

  async update(server: CdrServer, item: any) {
    let sql = "update `" + "cdr_log" + "` "   // server.table_name
    let values = ""

    try {
      if (item.StartTime!=null && item.ConnectedTime==null && item.EndTime!=null && item.Duration!=null && item.Duration>0) {
      } else {
        return
      }

      Object.keys(item).forEach((name: string) => {
        if (name!='SessionId' && item[name]!=null) {
          // if (fields!="")
          if (values!="")
            values += ", "
          values += "`" + name + "`="
          values += "'" + item[name] + "'"
        }
      })

      sql += + " set " + values + " where `ServerId`=" + server.id + " and `SessionId`='" + item.SessionId+"' "

      await this.cdrHistoryRepository.execute(sql)
    } catch (err) {
    }
  }

/*
  async compare(server: CdrServer, file: any, history_id: string, opposite: any) {
    const CDR_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.CDR_HOME);
    const history = await this.saveServerHistory(server.id!, file.name, JOB_STATUS.DOWNLOADING, history_id)
    const fs = require('fs')

    const original_log = "cdr_original_" + Math.random().toString(36).substring(2, 15) + ".log"
    const compare_log = "cdr_compare_" + Math.random().toString(36).substring(2, 15) + ".log"

    await this.unzip(CDR_HOME + "/" + server.table_name + "/" + opposite.id + "_" + file.name, CDR_HOME + "/" + server.table_name + "/" + original_log)
    await this.unzip(CDR_HOME + "/" + server.table_name + "/" + server.id + "_" + file.name, CDR_HOME + "/" + server.table_name + "/" + compare_log)

    const log_file = file.name.replace(".gz", "")
    console.log(server.name + " > " + log_file + " is comparing....")

    await this.saveServerHistory(server.id!, file.name, JOB_STATUS.IMPORTING, log_file + " is comparing....",  history.id)

    let content1 = ""
    try {
      const buffer = fs.readFileSync(CDR_HOME + "/" + server.table_name + "/" + original_log)
      content1 = buffer.toString()
    } catch (err) {
      console.log(server.name + " > " + log_file + " has error to read....")
      await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, log_file + " has error to read....", history.id)
      return
    }

    let content2 = ""
    try {
      const buffer = fs.readFileSync(CDR_HOME + "/" + server.table_name + "/" + compare_log)
      content2 = buffer.toString()
    } catch (err) {
      console.log(server.name + " > " + log_file + " has error to read....")
      await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, log_file + " has error to read....", history.id)
      return
    }

    const items1 = await this.read(content1)
    const items2 = await this.read(content2)
    let item3: any[] = []
    item3 = item3.concat(items1)
    item3 = item3.concat(items2)

    // item3.sort((a: any, b: any) => a.SessionId < b.SessionId ? -1 : 1)

    // for (let item of items2) {
    //   if (item.SessionId==null || item.SessionId=="") {
    //
    //   } else {
    //     const exist = items1.find((row: any) => row.SessionId==item.SessionId)
    //     if (exist==null)
    //       item3.push(item)
    //   }
    // }

    let item4: any[] = []
    let lastSessionId = ""
    let SessionIds: string[] = []
    item3.forEach((item: any) => {
      if (lastSessionId!=item.SessionId && !SessionIds.includes(item.SessionId)) {
        const filtered: any[] = item3.filter((row: any) => item.SessionId==row.SessionId)
        filtered.sort((a: any, b: any) => a.Duration < b.Duration ? -1 : 1)

        let resultItem = {...filtered[filtered.length-1]}
        const info = filtered.filter((row: any) => row.StartTime && row.StartTime>0 && row.ConnectedTime && row.ConnectedTime>0 && row.EndTime && row.EndTime>0 && row.Calling!='' && row.Called!='')
        if (info && info.length>0)
          resultItem = { ...info[info.length-1]}

        SessionIds.push(item.SessionId)

        item4.push(resultItem)
      }

      lastSessionId = item.SessionId
    })


    if (item4.length==0) {
      console.log(server.name + " > " + log_file + " has already imported....")
      await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, log_file + " has already imported....", history.id)
      return
    } else
      console.log(server.name + " > " + log_file + " has different logs....")

    for (let item of item4) {
      await this.alter(server, item)
    }

    await DataUtils.sleep(1000)

    for (let item of item4) {
      if (item.SessionId==null || item.Duration==null) {
      } else {
        await this.insert(server, item)
      }
    }

    // TODO - remove log file
    await DataUtils.sleep(100)
    // await this.delete(CDR_HOME + "/" + server.table_name + "/" + "compare_" + file.name)
    await this.delete(CDR_HOME + "/" + server.table_name + "/" + original_log)
    await this.delete(CDR_HOME + "/" + server.table_name + "/" + compare_log)

    await this.saveServerHistory(server.id!, "compare_" + file.name, JOB_STATUS.SUCCESS, "Successfully imported", history.id)
    await DataUtils.sleep(100)
  }
*/

  async getLRN(did: string) {
    try {
      const response: any = await axios(LRN_API_URL, {
        method: 'post',
        data: {
          did: did
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }
      })

      if (response.data.lrn!=null)
        return response.data.lrn
    } catch (err) {
      console.log(err)
    }

    return "";
  }

  async import(server: CdrServer, files: any[]) {
    const CDR_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.CDR_HOME);
    // const oppsite: any = await this.getOppositeServer(server)

    for (let file of files) {
      const history = await this.saveServerHistory(server.id!, file.name, JOB_STATUS.DOWNLOADING)

      const downloadResult = await this.ftpService.download(server, file.name, CDR_HOME, server.id+"_")
      if (!downloadResult.success) {
        console.log(server.name + + " > " + file.name + " is not downloaded.")
        await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, file.name + " is not downloaded.", history.id)
        continue
      }

      const fs = require('fs')
      // if (oppsite && fs.existsSync(CDR_HOME + "/" + oppsite.id + "_" + file.name)) { // + server.table_name + "/"
      //   console.log(server.name + " > " + file.name + " is already downloaded.")
      //   await this.compare(server, file, history.id!, oppsite)
      //   // await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, file.name + " is already downloaded.", history.id)
      //   continue
      // }

      await DataUtils.sleep(100)

      await this.unzip(CDR_HOME + "/" + server.id + "_" + file.name) // server.table_name + "/" +
      const log_file = file.name.replace(".gz", "")

      console.log(server.name + " > " + log_file + " is generated....")

      await this.saveServerHistory(server.id!, file.name, JOB_STATUS.IMPORTING, log_file + " is generated....",  history.id)

      // TODO - importing
      let content = ""
      try {
        const buffer = fs.readFileSync(CDR_HOME + "/" + server.id + "_" + log_file) //  server.table_name + "/" +
        content = buffer.toString()
      } catch (err) {
        console.log(server.name + " > " + log_file + " has error to read...." + err.message)
        await this.saveServerHistory(server.id!, file.name, JOB_STATUS.FAILED, log_file + " has error to read....", history.id)
        return
      }

      const items = await this.read(content)

      for (let item of items) {
        await this.alter(server, item)
      }

      await DataUtils.sleep(1000)

      for (let item of items) {
        if (item.SessionId==null || item.SessionId=="" || item.Duration==null) {

        } else {
          await this.insert(server, item)
        }
      }

      // TODO - remove log file
      await DataUtils.sleep(100)
      await this.delete(CDR_HOME + "/" + server.id + "_" + log_file) // server.table_name + "/" +

      await this.saveServerHistory(server.id!, undefined, JOB_STATUS.SUCCESS, "Successfully imported", history.id)
      await DataUtils.sleep(100)
    }
  }

  async read(content: string): Promise<any> {
    // console.log(content)
    let result: any[] = []
    let items: any = content.split('\n');
    items = items.map((item: string)=>{
      let row: any = {};

      row['Datetime'] = item.split(',')[0].split('.')[0]
      row['StatusType'] = item.split(',')[1];

      let properties: any[] = item.split(',').filter(dd=>dd.includes('='));
      properties.forEach(aa=>{
        row[aa.split('=')[0].replaceAll(":","_")] = aa.split('=')[1].replaceAll("'", "").replaceAll("\r", "").trim();
      });

      return row;
    });

    let lastSessionId = ""
    let SessionIds: string[] = []
    items.forEach((item: any) => {
      if (lastSessionId!=item.SessionId && !SessionIds.includes(item.SessionId)) {
        const filtered: any[] = items.filter((row: any) => item.SessionId==row.SessionId)
        filtered.sort((a: any, b: any) => a.Duration < b.Duration ? -1 : 1)

        let resultItem = {...filtered[filtered.length-1]}
        const info = filtered.filter((row: any) => row.StartTime && row.StartTime>0 && row.ConnectedTime && row.ConnectedTime>0 && row.EndTime && row.EndTime>0 && row.Calling!='' && row.Called!='')
        if (info && info.length>0)
          resultItem = { ...info[info.length-1]}

        // resultItem.Duration = filtered[filtered.length-1]

        try {
          delete resultItem.Datetime
        } catch (err){}

        try {
          delete resultItem.StatusType
        } catch (err){}

        try {
          delete resultItem.Direction
        } catch (err){}

        try {
          delete resultItem.LegId
        } catch (err){}

        try {
          delete resultItem.NAP
        } catch (err){}

        try {
          delete resultItem.TerminationSource
        } catch (err){}

        try {
          delete resultItem.Media
        } catch (err){}

        const begs = filtered.filter((row: any) => row["StatusType"]?.toString() == "BEG")
        if (begs && begs.length>0) {
          const beg = begs[begs.length-1]
          resultItem["TerminationSource_BEG"] = beg['TerminationSource'];
        }

        const ends = filtered.filter((row: any) => row["StatusType"]?.toString() == "END")
        if (ends && ends.length>0) {
          const end = ends[ends.length-1]
          resultItem["TerminationSource_End"] = end['TerminationSource'];
        }

        const beg_originates = filtered.filter((row: any) => row["StatusType"]?.toString() == "BEG" && row["Direction"]?.toString() == "originate")
        if (beg_originates && beg_originates.length>0) {
          const beg_originate = beg_originates[beg_originates.length-1]
          resultItem['Datetime1'] = beg_originate['Datetime']
        }

        const beg_answers = filtered.filter((row: any) => row["StatusType"]?.toString() == "BEG" && row["Direction"]?.toString() == "answer")
        if (beg_answers && beg_answers.length>0) {
          const beg_answer = beg_answers[beg_answers.length-1]
          resultItem['Datetime2'] = beg_answer['Datetime']
        }

        const end_originates = filtered.filter((row: any) => row["StatusType"]?.toString() == "END" && row["Direction"]?.toString() == "originate")
        if (end_originates && end_originates.length>0) {
          const end_originate = end_originates[end_originates.length-1]
          resultItem['Datetime3'] = end_originate['Datetime']
        }

        const end_answers = filtered.filter((row: any) => row["StatusType"]?.toString() == "END" && row["Direction"]?.toString() == "answer")
        if (end_answers && end_answers.length>0) {
          const end_answer = end_answers[end_answers.length-1]
          resultItem['Datetime4'] = end_answer['Datetime']
        }

        const originates = filtered.filter((row: any) => row["Direction"]?.toString() == "originate")
        if (originates && originates.length>0) {
          const originate = originates[originates.length-1]
          resultItem['LegId_Originate'] = originate['LegId']
          resultItem['NAP_Originate'] = originate['NAP']
          resultItem['Media_Originate'] = originate['Media']
        }

        const answers = filtered.filter((row: any) => row["Direction"]?.toString() == "answer")
        if (answers && answers.length>0) {
          const answer = answers[answers.length-1]
          resultItem['LegId_Answer'] = answer['LegId']
          resultItem['NAP_Answer'] = answer['NAP']
          resultItem['Media_Answer'] = answer['Media']
        }

        SessionIds.push(item.SessionId)

        result.push(resultItem)
      }

      lastSessionId = item.SessionId
    })

    return result
  }

  private async unzip(filename: string, other?: string) {
    if (other)
      await shellExec("sudo gzip -dc " + filename + " > " + other)
    else
      await shellExec("sudo gzip -dk " + filename)
  }

  private async delete(filename: string) {
    await shellExec("sudo rm -rf " + filename)
  }

  private async getWhere(payload: any, alias: string) {
    const { server, value, start_at, end_at, duration_op, duration, calls_op, calls, nap } = payload

    let Calling = "`Calling`"
    let Called = "`Called`"
    let NAP_Originate = "`NAP_Originate`"
    let NAP_Answer = "`NAP_Answer`"
    let StartTime = "`StartTime`"
    let Duration = "`Duration`"
    let LRN = "`LRN`"

    let where = " ( " + alias + StartTime + " between " + start_at + " and " + end_at + " ) "

    if (server!="")
      where += " and " + alias + "`ServerId`=" + server + " "

    let v_where = ""
    if (value!="") {
      v_where = "("
      const num_value = value.replace(/\D/g, '')
      if (num_value!="") {
        v_where += alias + Calling + " like '%" + num_value + "%' "
        v_where += " or "
        v_where += alias + Called + " like '%" + num_value + "%' "
        v_where += " or "
        v_where += alias + LRN + " like '%" + num_value + "%' "
      }

      if (v_where!="")
        v_where += " or "
      v_where += "lower("+alias + NAP_Originate+")" + " like '%" + value.toLowerCase() + "%' "

      v_where += " or "
      v_where += "lower("+alias + NAP_Answer+")" + " like '%" + value.toLowerCase() + "%' "

      v_where += ")"
    }

    if (v_where!="")
      where += " and " + v_where

    if (duration_op!="") {
      let d_where = ""
      if (duration_op=='between')
        d_where = " ( " + alias + Duration + " " + duration_op + " " + duration + " ) "
      else
        d_where = " ( " + alias + Duration + duration_op + duration + " ) "

      where += " and " + d_where
    }

    if (nap!="") {
      where += " and (" + alias + NAP_Originate + "='" + nap + "' or " + alias + NAP_Answer + "='" + nap + "' ) "
    }

    if (calls_op!="") {
      // // let d_where = " select concat(" + Calling + ", " + Called + ") as callnum, count(*) as cnt" +
      // //               " from " + table  +
      // //               " where " + Calling + " is not null and " + Called + " is not null " + where2
      // //               " group by " + Calling + ", " + Called + " "
      // if (calls_op=='between')
      //   d_where += " having " + "cnt" + " " + calls_op + " " + calls + " "
      // else
      //   d_where += " having " + "cnt" + calls_op + calls + " "

      // where += " and concat(" + alias + Calling + ", " + alias + Called + ") in ( select cn.callnum from (" + d_where + ") cn )"
    }

    return where
  }

  async counts(payload: any): Promise<any> {
    let Calling = "`Calling`"
    let Called = "`Called`"
    const { server, calls_op, calls } = payload

    let sql: string = " select `b`.* "
    let where = await this.getWhere(payload, "`b`.")
    let where2 = await this.getWhere(payload, "`a`.")

    sql += ", ( select count(*) from `" + "cdr_log" + "` as `a` "
    if (where2!="")
      sql += " where " + where2 + " and "
    else
      sql += " where "

    sql += " `a`." + Calling + "=" + "`b`." + Calling + " and `a`." + Called + "=" + "`b`." + Called
    sql += " ) as `calls` "
    sql += " from `" + "cdr_log" + "` as `b`"

    if (where!="")
      sql += " where " + where

    if (calls_op!="") {
      if (calls_op=='between')
        sql += " having " + "calls" + " " + calls_op + " " + calls + " "
      else
        sql += " having " + "calls" + calls_op + calls + " "
    }

    sql = " select count(*) as total_count from (" + sql + ") as `c` "
    const res = await this.cdrHistoryRepository.execute(sql)
    if (res!=null && res.length>0) {
      return res[0]
    }

    return { total_count: 0 }
  }

  async finds(payload: any): Promise<any> {
    let Calling = "`Calling`"
    let Called = "`Called`"

    const { server, order, skip, limit, calls_op, calls } = payload

    let sql: string = " select `b`.* "
    let where = await this.getWhere(payload, "`b`.")
    let where2 = await this.getWhere(payload, "`a`.")

    sql += ", ( select count(*) from `" + "cdr_log" + "` as `a` "
    if (where2!="")
      sql += " where " + where2 + " and "
    else
      sql += " where "

    sql += " `a`." + Calling + "=" + "`b`." + Calling + " and `a`." + Called + "=" + "`b`." + Called
    sql += " ) as `calls` "
    sql += " from `" + "cdr_log" + "` as `b`"

    if (where!="")
      sql += " where " + where

    if (calls_op!="") {
      if (calls_op=='between')
        sql += " having " + "calls" + " " + calls_op + " " + calls + " "
      else
        sql += " having " + "calls" + calls_op + calls + " "
    }

    if (order!="") {
      sql += " order by " + "`b`." + order
    }

    sql += " limit " + skip  + ", " + limit

    return this.cdrHistoryRepository.execute(sql)
  }

  async export(payload: any): Promise<any> {
    let Calling = "`Calling`"
    let Called = "`Called`"

    const { server, order, calls_op, calls } = payload

    let sql: string = " select `b`.* "
    let where = await this.getWhere(payload, "`b`.")
    let where2 = await this.getWhere(payload, "`a`.")

    sql += ", ( select count(*) from `" + "cdr_log" + "` as `a` "
    if (where2!="")
      sql += " where " + where2 + " and "
    else
      sql += " where "

    sql += " `a`." + Calling + "=" + "`b`." + Calling + " and `a`." + Called + "=" + "`b`." + Called
    sql += " ) as `calls` "
    sql += " from `" + "cdr_log" + "` as `b`"

    if (where!="")
      sql += " where " + where

    if (calls_op!="") {
      if (calls_op=='between')
        sql += " having " + "calls" + " " + calls_op + " " + calls + " "
      else
        sql += " having " + "calls" + calls_op + calls + " "
    }

    if (order!="") {
      sql += " order by " + "`b`." + order
    }

    return this.cdrHistoryRepository.execute(sql)
    // // logs = logs.map((u: any) => {
    // //   u.StartTime = u.StartTime ? moment(new Date(Number(u.StartTime) * 1000)).format('MM/DD/YYYY h:mm:ss A') : '';
    // //   return u
    // // })
    // const path = TEMPORARY + 'CDRLog_' + Math.random().toString(36).substring(2, 15) + ".csv"
    //
    // const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    // const csvWriter = createCsvWriter({
    //   path: path,
    //   header: [
    //     {id: 'StartTime', title: 'Start Time'},
    //     {id: 'EndTime', title: 'End Time'},
    //     {id: 'Calling', title: 'Calling'},
    //     {id: 'Called', title: 'Called'},
    //     {id: 'calls', title: 'Calls'},
    //     {id: 'Duration', title: 'Duration'},
    //     {id: 'NAP_Originate', title: 'NAP Originate'},
    //     {id: 'NAP_Answer', title: 'NAP Answer'},
    //   ]
    // });
    //
    // await csvWriter.writeRecords(logs)
    // return path
  }

  async execute(query: string) {
    return this.cdrHistoryRepository.execute(query)
  }

  async getNAPs() {
    let sql = " select `name` from `" + "cdr" + "_nap` group by `name` order by `name`"
    return this.cdrHistoryRepository.execute(sql)
  }

}
