import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor, HttpErrors,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  BulkUpload,
  Customer,
  CustomerRate, CustomerResourceGroup, VendorRate,
} from '../models';
import {CustomerRateRepository, CustomerRepository, VendorRateRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';
import {CustomerService, UploadService} from '../services';
import {TEMPORARY} from '../config';
import * as fs from "fs";
import {RATE_TYPE, UPLOAD_METHOD} from '../constants/configurations';

@authenticate('jwt')
export class VendorVendorRateController {
  constructor(
    @repository(CustomerRateRepository) protected customerRateRepository: CustomerRateRepository,
    @repository(CustomerRepository) protected customerRepository: CustomerRepository,
    @repository(VendorRateRepository) protected vendorRateRepository: VendorRateRepository,
    @service(CustomerService) protected customerService: CustomerService,
    @service(UploadService) protected uploadService: UploadService,
  ) { }

  @get('/vendors/{id}/rates/count', {
    description: 'Get count of VendorRate',
    responses: {
      '200': {
        description: 'VendorRate model count',
        content: {'application/json': {schema: CountSchema}},
      }
    }
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.query.string('value') value: string,
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = [ {customer_id: id} ]

    return this.vendorRateRepository.count(DataUtils.getWhere(value,
      ['npanxx', 'inter_rate', 'intra_rate', 'init_duration', 'succ_duration', 'ocn', 'ocn_name', 'state', 'category', 'lata'],
      'npanxx,inter_rate,intra_rate,init_duration,succ_duration', custom));
  }

  @get('/vendors/{id}/rates', {
    responses: {
      '200': {
        description: 'Array of Vendor has many VendorRate',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(VendorRate)},
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.query.number('limit') limit: number,
    @param.query.number('skip') skip: number,
    @param.query.string('order') order: string,
    @param.query.string('value') value: string,
  ): Promise<VendorRate[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let include: any[] = []
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

    let custom: any[] = [ {customer_id: id} ]

    return this.vendorRateRepository.find(DataUtils.getFilter(limit, skip, order, value,
      ['npanxx', 'inter_rate', 'intra_rate', 'init_duration', 'succ_duration', 'ocn', 'ocn_name', 'state', 'category', 'lata'],
      'npanxx,inter_rate,intra_rate,init_duration,succ_duration', custom, include));
  }

  @get('/vendors/rates/{id}', {
    responses: {
      '200': {
        description: 'VendorRate',
        content: {
          'application/json': {
            schema: getModelSchemaRef(VendorRate),
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<VendorRate> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.vendorRateRepository.findById(id)
  }

  @post('/vendors/{id}/rates', {
    responses: {
      '200': {
        description: 'Vendor Rates model instance',
        content: {'application/json': {schema: getModelSchemaRef(VendorRate)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: typeof Customer.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(VendorRate, {
            title: 'NewVendorRate',
            exclude: ['id','customer_id','created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    }) customerRate: Omit<VendorRate, 'id,customer_id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<VendorRate> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customerRate.npanxx=="" || customerRate.init_duration<=0 || customerRate.succ_duration<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (customerRate.inter_rate<=0 || customerRate.intra_rate<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const rates = await this.vendorRateRepository.findOne({where: {and: [{npanxx: customerRate.npanxx}, {customer_id: id}]}})
    if (rates)
      throw new HttpErrors.BadRequest("The Rates have same Prefix already existed.")

    customerRate.customer_id = id!

    customerRate.created_by = profile.user.id
    customerRate.created_at = new Date().toISOString()
    customerRate.updated_by = profile.user.id
    customerRate.updated_at = new Date().toISOString()

    return this.vendorRateRepository.create(customerRate);
  }

  @patch('/vendors/rates/{id}', {
    responses: {
      '200': {
        description: 'VendorRate PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(VendorRate, {
            title: 'NewVendorRate',
            exclude: ['id', 'customer_id','created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    })
      customerRate: Omit<VendorRate, 'id,customer_id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customerRate.npanxx=="" || customerRate.init_duration<=0 || customerRate.succ_duration<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (customerRate.inter_rate<=0 || customerRate.intra_rate<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const r = await this.vendorRateRepository.findById(id);
    if (!r)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const rates = await this.vendorRateRepository.findOne({where: {and: [{npanxx: customerRate.npanxx}, {customer_id: r.customer_id}]}})
    if (rates && rates.id!=id)
      throw new HttpErrors.BadRequest("The Rates have same NpaNxx.")

    customerRate.updated_by = profile.user.id
    customerRate.updated_at = new Date().toISOString()

    await this.vendorRateRepository.updateById(id, customerRate)
  }

  @del('/vendors/rates/{id}', {
    responses: {
      '200': {
        description: 'VendorRate DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.vendorRateRepository.deleteById(id)
  }

  @get('/vendors/{id}/rates/default', {
    description: 'Get default values of VendorRate',
    responses: {
      '200': {
        description: 'VendorRate Default Value',
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {

              }
            }
          }
        },
      }
    }
  })
  async default(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<any> {
    return this.customerService.getDefaultRates(id)
  }

  @post('/vendors/{id}/rates/upload', {
    responses: {
      '200': {
        description: 'Vendor Rates model instance',
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
    @param.path.number('id') id: typeof Customer.prototype.id,
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
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const customer = await this.customerRepository.findById(id)
    if (!customer)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (upload.method=="" || upload.encoded_file=="" || upload.extension=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const filename = TEMPORARY + "rates_"
      + Math.random().toString(36).substring(2, 15)
      + Math.random().toString(36).substring(2, 15)
      + "." + upload.extension

    try {
      fs.writeFileSync(filename, upload.encoded_file, 'base64')
    } catch (err) {
      throw new HttpErrors.BadRequest("Failed to write temporary file.")
    }

    const defaults = await this.customerService.getDefaultRates(id!)
    if (defaults==null)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    return this.uploadService.readVendorRates(id!, profile, upload, filename, defaults)
  }
}
