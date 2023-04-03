import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
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
import {BulkUpload, Customer, CustomerRate, Lerg} from '../models';
import {LergRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';
import {RATE_TYPE, UPLOAD_METHOD} from '../constants/configurations';
import {TEMPORARY} from '../config';
import * as fs from "fs";

@authenticate('jwt')
export class LergController {
  constructor(
    @repository(LergRepository)
    public lergRepository : LergRepository,
  ) {}

  @post('/lergs')
  @response(200, {
    description: 'Lerg model instance',
    content: {'application/json': {schema: getModelSchemaRef(Lerg)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Lerg, {
            title: 'NewLerg',
            exclude: ['id', 'created_at', 'updated_at'],
          }),
        },
      },
    })
    lerg: Omit<Lerg, 'id,created_at,updated_at'>,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Lerg> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_LERG_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (lerg.npanxx=="" || lerg.lata=="" || lerg.ocn=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const le = await this.lergRepository.findOne({where: {npanxx: lerg.npanxx, thousand: lerg.thousand}})
    if (le)
      throw new HttpErrors.BadRequest("NpaNxx have already existed!")

    lerg.created_at = new Date().toISOString()
    lerg.updated_at = new Date().toISOString()

    return this.lergRepository.create(lerg);
  }

  @get('/lergs/count')
  @response(200, {
    description: 'Lerg model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('value') value: string
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_LERG_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.lergRepository.count(DataUtils.getWhere(value,
      ['npanxx', 'lata','lata_name','ocn','ocn_name','rate_center','country','state','abbre','company','category','thousand','clli','irec','switch_name','switch_type','note'],
      'npanxx', undefined));
  }

  @get('/lergs')
  @response(200, {
    description: 'Array of Lerg model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Lerg, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.number('limit') limit: number,
    @param.query.number('skip') skip: number,
    @param.query.string('order') order: string,
    @param.query.string('value') value: string
  ): Promise<Lerg[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_LERG_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.lergRepository.find(DataUtils.getFilter(limit, skip, order, value,
      ['npanxx', 'lata','lata_name','ocn','ocn_name','rate_center','country','state','abbre','company','category','thousand','clli','irec','switch_name','switch_type','note'],
      'npanxx', undefined, undefined));
  }

  @get('/lergs/{id}')
  @response(200, {
    description: 'Lerg model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Lerg, {includeRelations: true}),
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<Lerg> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_LERG_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.lergRepository.findById(id);
  }

  @patch('/lergs/{id}')
  @response(204, {
    description: 'Lerg PATCH success',
  })
  async updateById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Lerg, {
            title: 'NewLerg',
            exclude: ['id', 'created_at', 'updated_at'],
          }),
        },
      },
    })
      lerg: Omit<Lerg, 'id,created_at,updated_at'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_LERG_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let le: any = await this.lergRepository.findById(id)
    if (!le)
      throw new HttpErrors.BadRequest("NpaNxx have not existed!")

    le = await this.lergRepository.findOne({where: {npanxx: lerg.npanxx}})
    if (!le || le.id!=id)
      throw new HttpErrors.BadRequest("NpaNxx have not existed!")

    lerg.updated_at = new Date().toISOString()

    await this.lergRepository.updateById(id, lerg);
  }

  @del('/lergs/{id}')
  @response(204, {
    description: 'Lerg DELETE success',
  })
  async deleteById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_LERG_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.lergRepository.deleteById(id);
  }

  @post('/lergs/upload', {
    responses: {
      '200': {
        description: 'Bulk Upload model instance',
        content: {'application/json': {schema: getModelSchemaRef(CustomerRate)}},
      },
    },
  })
  async upload(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: "object",
            properties: {
              method: {
                type: "string",
                example: "one of the 'APPEND', 'UPDATE', 'DELETE' "
              },
              encoded_file: {
                type: "string",
                description: 'Base64 encoded text',
                example: "RGID, Partition ID, IP, Direction, Description"
              },
              extension: {
                type: "string",
                example: "one of the 'csv', 'xls', 'xlsx' "
              }
            },
          }
        },
      },
    }) upload: BulkUpload,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_LERG_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (upload.method=="" || upload.encoded_file=="" || upload.extension=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const filename = TEMPORARY + "lerg_"
      + Math.random().toString(36).substring(2, 15)
      + Math.random().toString(36).substring(2, 15)
      + "." + upload.extension

    let completed = 0, failed = 0
    let message: string = ""

    try {
      fs.writeFileSync(filename, upload.encoded_file, 'base64')
    } catch (err) {
      throw new HttpErrors.BadRequest("Failed to write temporary file.")
    }

    const Excel = require('exceljs');
    const workbook = new Excel.Workbook();
    const worksheet = await DataUtils.getWorksheet(workbook, filename, upload.extension)
      .catch(err => {
        throw new HttpErrors.BadRequest("Failed to read uploaded file.")
      })

    if (worksheet==null)
      throw new HttpErrors.BadRequest("Failed to read uploaded file.")

    // @ts-ignore
    for (let index=1; index<=worksheet.rowCount; index++)  {
      if (index==1)
        continue

      // @ts-ignore
      let npanxx = worksheet.getCell('A'+index).value
      // @ts-ignore
      let lata = worksheet.getCell('B'+index).value
      // @ts-ignore
      let ocn = worksheet.getCell('C'+index).value
      // @ts-ignore
      let ocn_name = worksheet.getCell('D'+index).value
      // @ts-ignore
      let abbre = worksheet.getCell('E'+index).value
      // @ts-ignore
      let state = worksheet.getCell('F'+index).value
      // @ts-ignore
      let category = worksheet.getCell('G'+index).value
      // @ts-ignore
      let rate = worksheet.getCell('H'+index).value
      // @ts-ignore
      let note = worksheet.getCell('I'+index).value

      if (npanxx==null || npanxx=="" || lata==null || lata=="" || ocn==null || ocn=="") {
        const err = "NpaNxx, LATA, OCN is a mandatory field."
        if (!message.includes(err))
          message += err + "\n"
        failed++
        continue
      }

      // initialize with default rates
      if (rate==null || rate=="")
        rate = 0.0
      else
        rate = Number(rate)

      let lerg = await this.lergRepository.findOne({where: {and: [{npanxx: npanxx}, {thousand: ''}]}})
      if (lerg) {
        if (upload.method==UPLOAD_METHOD.APPEND) {
          const err = "NpaNxx have already existed."
          if (!message.includes(err))
            message += err + "\n"
          failed++
        }
        else if (upload.method==UPLOAD_METHOD.UPDATE) {
          lerg.lata = lata
          lata.thousand = ""

          lerg.ocn = ocn
          if (ocn_name!=null && ocn_name!="")
            lerg.ocn_name = ocn_name

          if (state!=null && state!="")
            lerg.state = state
          if (abbre!=null && abbre!="")
            lerg.abbre = abbre
          if (category!=null && category!="")
            lerg.category = category

          if (rate>=0)
            lerg.rate = rate

          if (note!=null && note!="")
            lerg.note = note

          lerg.updated_at = new Date().toISOString()

          await this.lergRepository.save(lerg)
          completed++
        }
        else if (upload.method==UPLOAD_METHOD.DELETE) {
          await this.lergRepository.deleteById(lerg.id)
          completed++
        }
      }
      else {
        if (upload.method==UPLOAD_METHOD.DELETE) {
          const err = "NpaNxx have not existed."
          if (!message.includes(err))
            message += err + "\n"
          failed++
        } else {
          lerg = new Lerg()
          lerg.npanxx = npanxx
          lata.thousand = ""
          lerg.lata = lata
          lerg.ocn = ocn
          lerg.ocn_name = ocn_name
          lerg.state = state
          lerg.abbre = abbre
          lerg.category = category
          lerg.rate = rate
          lerg.note = note

          lerg.created_at = new Date().toISOString()
          lerg.updated_at = new Date().toISOString()

          await this.lergRepository.create(lerg)
          completed++
        }
      }
    }

    return { completed, failed, message }
  }
}
