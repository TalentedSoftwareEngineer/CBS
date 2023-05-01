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
  CustomerResourceGroup,
} from '../models';
import {CustomerRepository, CustomerResourceGroupRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import DataUtils from '../utils/data';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import {TEMPORARY} from '../config';
import * as fs from 'fs';
import {UPLOAD_METHOD} from '../constants/configurations';
import {UploadService} from '../services';

@authenticate('jwt')
export class CustomerCustomerResourceGroupController {
  constructor(
    @repository(CustomerResourceGroupRepository) protected customerResourceGroupRepository: CustomerResourceGroupRepository,
    @repository(CustomerRepository) protected customerRepository: CustomerRepository,
    @service(UploadService) protected uploadService: UploadService,
  ) { }

  @get('/customers/{id}/rg/count', {
    description: 'Get count of CustomerResourceGroup',
    responses: {
      '200': {
        description: 'CustomerResourceGroup model count',
        content: {'application/json': {schema: CountSchema}},
      }
    }
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.query.string('value') value: string,
    @param.query.string('directionFilter') directionFilter: string,
    @param.query.string('activeFilter') activeFilter: string,
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = [ {customer_id: id} ]
    if (directionFilter!="")
      custom.push({direction: directionFilter} )
    if (activeFilter!="")
      custom.push({active: activeFilter=="Y"})

    return this.customerResourceGroupRepository.count(DataUtils.getWhere(value,
      ['rgid', 'partition_id', 'ip', 'description'], 'partition_id', custom));
  }

  @get('/customers/{id}/rg', {
    responses: {
      '200': {
        description: 'Array of Customer has many CustomerResourceGroup',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(CustomerResourceGroup)},
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
    @param.query.string('directionFilter') directionFilter: string,
    @param.query.string('activeFilter') activeFilter: string,
  ): Promise<CustomerResourceGroup[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

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

    let custom: any[] = [ {customer_id: id} ]
    if (directionFilter!="")
      custom.push({direction: directionFilter} )
    if (activeFilter!="")
      custom.push({active: activeFilter=="Y"})

    return this.customerRepository.customerResourceGroups(id).find(DataUtils.getFilter(limit, skip, order, value,
      ['rgid', 'partition_id', 'ip', 'description'], 'partition_id', custom, include));
  }

  @get('/customers/rg/{id}', {
    responses: {
      '200': {
        description: 'CustomerResourceGroup',
        content: {
          'application/json': {
            schema: getModelSchemaRef(CustomerResourceGroup),
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<CustomerResourceGroup> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.customerResourceGroupRepository.findById(id)
  }

  @post('/customers/{id}/rg', {
    responses: {
      '200': {
        description: 'Customer RG model instance',
        content: {'application/json': {schema: getModelSchemaRef(CustomerResourceGroup)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: typeof Customer.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerResourceGroup, {
            title: 'NewCustomerResourceGroupInCustomer',
            exclude: ['id', 'customer_id', 'created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    }) customerResourceGroup: Omit<CustomerResourceGroup, 'id,customer_id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<CustomerResourceGroup> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customerResourceGroup.rgid=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const rg = await this.customerResourceGroupRepository.findOne({where: {rgid: customerResourceGroup.rgid}})
    if (rg)
      throw new HttpErrors.BadRequest("RGID have already used. Please use different RGID.")

    customerResourceGroup.customer_id = id!

    customerResourceGroup.created_by = profile.user.id
    customerResourceGroup.created_at = new Date().toISOString()
    customerResourceGroup.updated_by = profile.user.id
    customerResourceGroup.updated_at = new Date().toISOString()

    return this.customerRepository.customerResourceGroups(id).create(customerResourceGroup);
  }

  @patch('/customers/rg/{id}', {
    responses: {
      '200': {
        description: 'Customer.CustomerResourceGroup PATCH success count',
        content: {'application/json': {schema: getModelSchemaRef(CustomerResourceGroup)}},
      },
    },
  })
  async patch(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerResourceGroup, {
            title: 'NewCustomerResourceGroupInCustomer',
            exclude: ['id', 'customer_id', 'rgid', 'created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    }) customerResourceGroup: Omit<CustomerResourceGroup, 'id,customer_id,rgid,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    // if (customerResourceGroup.partition_id==null || customerResourceGroup.partition_id<=0)
    //   throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    customerResourceGroup.updated_by = profile.user.id
    customerResourceGroup.updated_at = new Date().toISOString()

    await this.customerResourceGroupRepository.updateById(id, customerResourceGroup)
  }

  @del('/customers/rg/{id}', {
    responses: {
      '200': {
        description: 'Customer.CustomerResourceGroup DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.customerResourceGroupRepository.deleteById(id)
  }

  @post('/customers/{id}/rg/upload', {
    responses: {
      '200': {
        description: 'Customer RG model instance',
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
                example: "NAP ID, Partition ID, IP, Direction, Description"
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
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (upload.method == "" || upload.encoded_file == "" || upload.extension == "")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const filename = TEMPORARY + "rg_"
      + Math.random().toString(36).substring(2, 15)
      + Math.random().toString(36).substring(2, 15)
      + "." + upload.extension

    try {
      fs.writeFileSync(filename, upload.encoded_file, 'base64')
    } catch (err) {
      throw new HttpErrors.BadRequest("Failed to write temporary file.")
    }

    return this.uploadService.readCustomerNAP(id!, profile, upload, filename)
  }
}
