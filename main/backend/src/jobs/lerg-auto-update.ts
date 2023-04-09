import {CronJob, cronJob} from "@loopback/cron";
import shellExec from 'shell-exec'
import {LergHistory, Lerg} from '../models';
import {CONFIGURATIONS, JOB_STATUS} from '../constants/configurations';
import {repository} from '@loopback/repository';
import {ConfigurationRepository, LergHistoryRepository, LergRepository} from '../repositories';
import directoryTree from 'directory-tree';
import DataUtils from '../utils/data';
import {SCP_PASS, SCP_PATH, SCP_SERVER, SCP_USER} from '../config';

@cronJob()
export class LergAutoUpdate extends CronJob {

  constructor(
    @repository(LergRepository) public lergRepository : LergRepository,
    @repository(LergHistoryRepository) public historyRepository : LergHistoryRepository,
    @repository(ConfigurationRepository) public configurationRepository : ConfigurationRepository,
  ) {
    super({
      name: 'lerg-auto-update',
      onTick: async () => {
        this.process()
      },
      cronTime: '0 0 0 * * *',
      start: false,
    });
  }

  public async process() {
    console.log("Start Lerg Updating-----")
    const LERG_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.LERG_HOME)

    let npanxxes: string[] = []
    let message = ""
    let completed = 0, failed = 0

    let history = new LergHistory()
    history.created_at = new Date().toISOString()
    history.updated_at = new Date().toISOString()
    history.status = JOB_STATUS.IN_PROGRESS

    while (true) {
      if (DataUtils.isJobFinished(history.status))
        break

      if (history.status==JOB_STATUS.IN_PROGRESS) {
        // download data*.zip
        const downloaded = await this.download()
        if (downloaded!="") {
          history.status = JOB_STATUS.FAILED
          message = downloaded
        } else {
          // list files
          const filename = await this.listFiles()
          if (filename=="") {
            history.status = JOB_STATUS.FAILED
            message = "No Updated File"
          } else {
            const unzip = await this.unzip(filename)
            if (unzip!="") {
              history.status = JOB_STATUS.FAILED
              message = unzip
            } else {
              history.filename = filename
              history.status = JOB_STATUS.DOWNLOADING
            }
          }
        }
      }
      else if (history.status == JOB_STATUS.DOWNLOADING) {
        history.status = JOB_STATUS.IMPORTING

        const csv = require('fast-csv')
        const fs = require('fs')

        fs.createReadStream(LERG_HOME + "/" + history.filename)
          .pipe(csv.parse({ delimiter: ",", headers: false }))
          .on('data', async (data: any) => {
            let npa = data['0']
            let nxx = data['1']
            let thousands = data['2']
            let state = data['3']
            let company = data['4']
            let ocn = data['5']
            let rate_center = data['6']
            let clli = data['7']
            let assign_date = data['8']
            let prefix_type = data['9']
            let switch_name = data['10']
            let switch_type = data['11']
            // let lata = worksheet.getCell('M'+index).value
            // let company = worksheet.getCell('N'+index).value
            let lata = data['14']
            let country = data['15']

            if (npa==null || npa=="" || nxx==null || nxx=="") {
              const err = "NpaNxx is a mandatory field."
              if (!message.includes(err))
                message += err + "\n"
              failed++
            } else {
              let npanxx = npa + nxx + thousands
              if (!npanxxes.includes(npanxx+thousands)) {
                npanxxes.push(npanxx+thousands)
                let lerg = await this.lergRepository.findOne({where: {npanxx: npanxx}})
                if (lerg) {
                  lerg.lata = lata
                  lerg.ocn = ocn
                  if (rate_center!=null && rate_center!="")
                    lerg.rate_center = rate_center
                  if (country!=null && country!="")
                    lerg.country = country
                  if (state!=null && state!="")
                    lerg.state = state
                  if (company!=null && company!="")
                    lerg.company = company
                  if (thousands!=null && thousands!="")
                    lerg.thousand = thousands
                  if (clli!=null && clli!="")
                    lerg.clli = clli

                  if (switch_name!=null && switch_name!="")
                    lerg.switch_name = switch_name
                  if (switch_type!=null && switch_type!="")
                    lerg.switch_type = switch_type

                  if (assign_date!=null && assign_date!="")
                    lerg.assign_date = assign_date
                  if (prefix_type!=null && prefix_type!="")
                    lerg.prefix_type = prefix_type

                  lerg.updated_at = new Date().toISOString()

                  await this.lergRepository.save(lerg)
                  completed++

                } else {
                  lerg = new Lerg()
                  lerg.npanxx = npanxx
                  lerg.lata = lata
                  lerg.ocn = ocn
                  lerg.rate_center = rate_center
                  lerg.country = country
                  lerg.state = state
                  lerg.company = company
                  lerg.thousand = thousands
                  lerg.clli = clli
                  lerg.switch_name = switch_name
                  lerg.switch_type = switch_type
                  lerg.assign_date = assign_date
                  lerg.prefix_type = prefix_type

                  lerg.created_at = new Date().toISOString()
                  lerg.updated_at = new Date().toISOString()

                  await this.lergRepository.create(lerg)
                  completed++
                }
              } else {
                const err = "Npa+Nxx+thousands is already in there."
                if (!message.includes(err))
                  message += err + "\n"
                failed++
              }
            }
          })
          .on('end', async () => {
            // history.status = JOB_STATUS.COMPLETED
            // this.finish(history, completed, failed, message)
          })
          .on('close', async () => {
            history.status = JOB_STATUS.COMPLETED
            this.finish(history, completed, failed, message)
          })
          .on('error', (err: any) => {
            if (err!=null && err.message!=null) {
              if (!message.includes(err.message))
                message += err.message + "\n"
            }

            history.status = JOB_STATUS.FAILED
            this.finish(history, completed, failed, message)
          })
      }
      else if (history.status == JOB_STATUS.IMPORTING) {
      }

      // console.log(history)
      await DataUtils.sleep(5000)
    }
  }

  private async finish(history: LergHistory, completed: number, failed:number, message: string) {
    if (history.status==JOB_STATUS.FAILED) {

    } else {
      if (failed == 0 && completed>0)
        history.status = JOB_STATUS.SUCCESS
      else if (completed>0)
        history.status = JOB_STATUS.COMPLETED
      else
        history.status = JOB_STATUS.FAILED
    }

    history.message = message
    history.completed = completed
    history.failed = failed
    history.total = completed + failed

    history.updated_at = new Date().toISOString()
    await this.historyRepository.create(history)

    await this.delete()
  }

  private async download(): Promise<string> {
    const LERG_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.LERG_HOME)
    const result = await shellExec("cd " + LERG_HOME + " && "
      + "sudo sshpass -p '"+SCP_PASS+"' scp "+SCP_USER+"@"+SCP_SERVER+":/"+SCP_PATH+" .")
    if (result.code==0)
      return  ""

    return result.stderr
  }

  private async listFiles(): Promise<string> {
    const LERG_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.LERG_HOME)
    const files: any = await directoryTree(LERG_HOME)
    if (files.children.length==0)
      return ""

    for (const item of files.children) {
      if (item.name.toLowerCase().includes("lerg_")) {
        const history = await this.historyRepository.findOne({where: {and: [ {or: [{status: JOB_STATUS.SUCCESS}, {status: JOB_STATUS.COMPLETED}]}, {filename: item.name}]}})
        if (!history)
          return item.name
      }
    }

    return ""
  }

  private async unzip(filename: string) {
    const LERG_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.LERG_HOME)
    const result = await shellExec("sudo chmod 0777 " + LERG_HOME + " && cd " + LERG_HOME + " && sudo unzip -p " + filename + " > " + filename + ".csv")
    if (result.code==0)
      return ""
    return result.stderr
  }

  private async delete() {
    const LERG_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.LERG_HOME)
    await shellExec("sudo rm -rf " + LERG_HOME + "/*")
  }
}