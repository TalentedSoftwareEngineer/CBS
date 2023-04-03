// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {ConfigurationRepository, HistoryRepository, LergRepository} from '../repositories';
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
import {LergAutoUpdate} from '../jobs/lerg-auto-update';
import {History, Lerg} from '../models';
import DataUtils from '../utils/data';
import shellExec from 'shell-exec';
import directoryTree from 'directory-tree';

export class HomeController {
  constructor(
    @repository(ConfigurationRepository)
    public configurationRepository : ConfigurationRepository,
    @repository(LergRepository)
    public lergRepository : LergRepository,
    @repository(HistoryRepository)
    public historyRepository : HistoryRepository,
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

  HOME_PATH = "/home/dipvadmin/cbs/lerg"

  SCP_SERVER = "208.78.161.26"
  SCP_USER = "federicoalves"
  SCP_PASS = "Akula123!"
  SCP_PATH = "f:/federico/lerg*.zip"

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
    await this.process()
    return {success: true}
  }

  public async process() {
    console.log("Start Lerg Updating-----")

    let npanxxes: string[] = []
    let message = ""
    let completed = 0, failed = 0

    // const tx = await this.lergRepository.beginTransaction()

    let history = new History()
    history.created_at = new Date().toISOString()
    history.updated_at = new Date().toISOString()
    history.status = JOB_STATUS.IN_PROGRESS
    history = await this.historyRepository.create(history)

    while (true) {
      if (DataUtils.isJobFinished(history.status))
        break

      if (history.status==JOB_STATUS.IN_PROGRESS) {
        // download data*.zip
        const downloaded = await this.download()
        if (downloaded!="") {
          history.status = JOB_STATUS.FAILED
          history.message = downloaded
        } else {
          // list files
          const filename = await this.listFiles()
          if (filename=="") {
            history.status = JOB_STATUS.FAILED
            history.message = "No Updated File"
          } else {
            const unzip = await this.unzip(filename)
            if (unzip!="") {
              history.status = JOB_STATUS.FAILED
              history.message = unzip
            } else {
              history.filename = filename
              history.status = JOB_STATUS.DOWNLOADING
            }
          }
        }
      }
      else if (history.status == JOB_STATUS.DOWNLOADING) {
        history.status = JOB_STATUS.IMPORTING

        const csv = require('csv-parser')
        const fs = require('fs')

        fs.createReadStream(this.HOME_PATH + "/" + history.filename + ".csv")
          .pipe(csv({ delimiter: ",", headers: false }))
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
              let npanxx = npa + nxx
              if (npanxxes.includes(npanxx+thousands))
                return
              npanxxes.push(npanxx+thousands)

              let lerg = await this.lergRepository.findOne({where: {and: [{npanxx: npanxx}, {thousand: thousands}]}})
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
            }
          })
          .on('end', async () => {
            if (failed == 0 && completed>0)
              history.status = JOB_STATUS.SUCCESS
            else if (completed>0)
              history.status = JOB_STATUS.COMPLETED
            else
              history.status = JOB_STATUS.FAILED

            history.message = message
            history.completed = completed
            history.failed = failed
            history.total = completed + failed
          });
      }
      else if (history.status == JOB_STATUS.IMPORTING) {
        history.message = message
        history.completed = completed
        history.failed = failed
        history.total = completed + failed
      }

      history.updated_at = new Date().toISOString()
      await this.historyRepository.save(history)

      // console.log(history)
      await DataUtils.sleep(1000)
    }

    this.delete()
    // await tx.commit()
  }

  private async download(): Promise<string> {
    const result = await shellExec("cd " + this.HOME_PATH + " && "
      + "sudo sshpass -p '"+this.SCP_PASS+"' scp "+this.SCP_USER+"@"+this.SCP_SERVER+":/"+this.SCP_PATH+" .")
    if (result.code==0)
      return  ""

    return result.stderr
  }

  private async listFiles(): Promise<string> {
    const files: any = await directoryTree(this.HOME_PATH)
    if (files.children.length==0)
      return ""

    for (const item of files.children) {
      if (item.name.toLowerCase().includes("lerg_")) {
        const history = await this.historyRepository.findOne({where: {and: [{filename: item.name}, {or: [{status: JOB_STATUS.SUCCESS}, {status: JOB_STATUS.COMPLETED}]}]}})
        if (!history)
          return item.name
      }
    }

    return ""
  }

  private async unzip(filename: string) {
    const result = await shellExec("sudo chmod 0777 " + this.HOME_PATH + " && cd " + this.HOME_PATH + " && sudo unzip -p " + filename + " > " + filename + ".csv")
    if (result.code==0)
      return ""
    return result.stderr
  }

  private async delete() {
    await shellExec("sudo rm -rf " + this.HOME_PATH + "/*")
  }

}
