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
    include.push({relation: 'created'})
    include.push({relation: 'updated'})

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

    if (customerResourceGroup.rgid=="" || customerResourceGroup.partition_id==null || customerResourceGroup.partition_id<=0)
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

    if (customerResourceGroup.partition_id==null || customerResourceGroup.partition_id<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

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
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (upload.method=="" || upload.encoded_file=="" || upload.extension=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const filename = TEMPORARY + "rg_"
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
      let rgid = worksheet.getCell('A'+index).value
      // @ts-ignore
      let pid = worksheet.getCell('B'+index).value
      // @ts-ignore
      let ip = worksheet.getCell('C'+index).value
      // @ts-ignore
      let direction = worksheet.getCell('D'+index).value
      // @ts-ignore
      let description = worksheet.getCell('E'+index).value

      if (rgid==null || rgid=="" || pid==null || pid=="") {
        const err = "RGID, PartitionID is a mandatory field."
        if (!message.includes(err))
          message += err + "\n"
        failed++
        continue
      }

      if (direction==null || direction=="")
        direction = "INBOUND"
      else if (direction.toUpperCase()=="OUTBOUND" || direction.toUpperCase()=="O")
        direction = "OUTBOUND"
      else
        direction = "INBOUND"

      // TODO - validate ip address.

      let rg: any = await this.customerResourceGroupRepository.findOne({where: {rgid: rgid}})
      if (rg) {
        if (upload.method==UPLOAD_METHOD.APPEND || rg.customer_id!=id) {
          const err = "Resource Group have already existed."
          if (!message.includes(err))
            message += err + "\n"
          failed++
        }
        else if (upload.method==UPLOAD_METHOD.UPDATE) {
          rg.partition_id = pid
          if (ip!=null && ip!="")
            rg.ip = ip

          if (description!=null && description!="")
            rg.description = description

          rg.direction = direction
          rg.active = true

          rg.updated_by = profile.user.id
          rg.updated_at = new Date().toISOString()

          await this.customerResourceGroupRepository.save(rg)
          completed++
        }
        else if (upload.method==UPLOAD_METHOD.DELETE) {
          await this.customerResourceGroupRepository.deleteById(rg.id)
          completed++
        }
      }
      else {
        if (upload.method==UPLOAD_METHOD.DELETE) {
          const err = "Resource Group have not existed."
          if (!message.includes(err))
            message += err + "\n"
          failed++
        } else {
          rg = new CustomerResourceGroup()
          rg.customer_id = id!
          rg.rgid = rgid
          rg.partition_id = pid
          rg.ip = ip
          rg.description = description
          rg.direction = direction
          rg.active = true

          rg.created_by = profile.user.id
          rg.created_at = new Date().toISOString()
          rg.updated_by = profile.user.id
          rg.updated_at = new Date().toISOString()

          await this.customerResourceGroupRepository.create(rg)
          completed++
        }
      }
    }

    // remove uploaded file
    try {
      fs.unlink(filename, ()=>{})
    } catch (err) {}

    return { completed, failed, message }
  }

}
