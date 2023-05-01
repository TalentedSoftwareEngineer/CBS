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
import {BulkUpload, Customer, TfnNumber} from '../models';
import {TfnNumberRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';
import {TEMPORARY} from '../config';
import * as fs from "fs";
import {UploadService} from '../services';

@authenticate('jwt')
export class TfnNumberController {
  constructor(
    @repository(TfnNumberRepository) public tfnNumberRepository : TfnNumberRepository,
    @service(UploadService) protected uploadService: UploadService,
  ) {}

  @post('/tfn-numbers')
  @response(200, {
    description: 'TfnNumber model instance',
    content: {'application/json': {schema: getModelSchemaRef(TfnNumber)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TfnNumber, {
            title: 'NewTfnNumber',
            exclude: ['id','created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    })
    tfnNumber: Omit<TfnNumber, 'id,created_at,created_by,updated_at,updated_by'>,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<TfnNumber> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_TFN_NUMBERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (tfnNumber.tfn_num=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const tfn = await this.tfnNumberRepository.findOne({where: {tfn_num: tfnNumber.tfn_num}})
    if (tfn)
      throw new HttpErrors.BadRequest("TFN Number have already existed")

    if (tfnNumber.customer_id==-1)
      tfnNumber.customer_id = null

    tfnNumber.created_at = new Date().toISOString()
    tfnNumber.created_by = profile.user.id
    tfnNumber.updated_at = new Date().toISOString()
    tfnNumber.updated_by = profile.user.id

    return this.tfnNumberRepository.create(tfnNumber);
  }

  @get('/tfn-numbers/count')
  @response(200, {
    description: 'TfnNumber model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('value') value: string,
    @param.query.string('customerId') customerId: string,
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_TFN_NUMBERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = []
    if (customerId && customerId!="") {
      custom.push({customer_id: customerId})
    }

    return this.tfnNumberRepository.count(DataUtils.getWhere(value,
      ['tfn_num', 'trans_num', 'resp_org', 'price'],
      'tfn_num,trans_num,price', custom));
  }

  @get('/tfn-numbers')
  @response(200, {
    description: 'Array of TfnNumber model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(TfnNumber, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.number('limit') limit: number,
    @param.query.number('skip') skip: number,
    @param.query.string('order') order: string,
    @param.query.string('value') value: string,
    @param.query.string('customerId') customerId: string,
  ): Promise<TfnNumber[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_TFN_NUMBERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = []
    if (customerId && customerId!="") {
      custom.push({customer_id: customerId})
    }

    let include = []
    include.push({
      relation: 'created',
      scope: {
        fields: { username: true, email: true, first_name: true, last_name: true }
      }
    })
    include.push({
      relation: 'updated',
      scope: {
        fields: { username: true, email: true, first_name: true, last_name: true }
      }
    })

    return this.tfnNumberRepository.find(DataUtils.getFilter(limit, skip, order, value,
      ['tfn_num', 'trans_num', 'resp_org', 'price'],
      'tfn_num,trans_num,price', custom, include));
  }

  @get('/tfn-numbers/{id}')
  @response(200, {
    description: 'TfnNumber model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(TfnNumber, {includeRelations: true}),
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<TfnNumber> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (profile.permissions.includes(PERMISSIONS.READ_TFN_NUMBERS) || profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS)) {
    } else
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.tfnNumberRepository.findById(id);
  }

  @patch('/tfn-numbers/{id}')
  @response(204, {
    description: 'TfnNumber PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TfnNumber, {
            title: 'NewTfnNumber',
            exclude: ['id','created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    })
    tfnNumber: Omit<TfnNumber, 'id,created_at,created_by,updated_at,updated_by'>,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_TFN_NUMBERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const tfn = await this.tfnNumberRepository.findOne({where: {tfn_num: tfnNumber.tfn_num}})
    if (tfn && tfn.id!=id)
      throw new HttpErrors.BadRequest("TFN Number have already existed")

    if (tfnNumber.customer_id==-1)
      tfnNumber.customer_id = null

    tfnNumber.updated_at = new Date().toISOString()
    tfnNumber.updated_by = profile.user.id

    await this.tfnNumberRepository.updateById(id, tfnNumber);
  }

  @del('/tfn-numbers/{id}')
  @response(204, {
    description: 'TfnNumber DELETE success',
  })
  async deleteById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_TFN_NUMBERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.tfnNumberRepository.deleteById(id);
  }

  @post('/tfn-numbers/upload', {
    responses: {
      '200': {
        description: 'Tfn Number model instance',
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {
                completed: {
                  type: 'number',
                },
                failed: {
                  type: 'number',
                },
                message: {
                  type: 'string'
                }
              }
            }
          }
        },
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
                example: "TFN Number, Customer, Price, Resp Org"
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
    if (!profile.permissions.includes(PERMISSIONS.WRITE_TFN_NUMBERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (upload.method=="" || upload.encoded_file=="" || upload.extension=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const filename = TEMPORARY + "tfn_number_"
      + Math.random().toString(36).substring(2, 15)
      + Math.random().toString(36).substring(2, 15)
      + "." + upload.extension

    try {
      fs.writeFileSync(filename, upload.encoded_file, 'base64')
    } catch (err) {
      throw new HttpErrors.BadRequest("Failed to write temporary file.")
    }

    return this.uploadService.readTfnNumbers(profile, upload, filename)
  }
}
