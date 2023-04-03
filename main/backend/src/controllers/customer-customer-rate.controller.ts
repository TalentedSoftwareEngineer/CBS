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
  CustomerRate, CustomerResourceGroup,
} from '../models';
import {CustomerRateRepository, CustomerRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';
import {CustomerService} from '../services';
import {TEMPORARY} from '../config';
import * as fs from "fs";
import {RATE_TYPE, UPLOAD_METHOD} from '../constants/configurations';

@authenticate('jwt')
export class CustomerCustomerRateController {
  constructor(
    @repository(CustomerRateRepository) protected customerRateRepository: CustomerRateRepository,
    @repository(CustomerRepository) protected customerRepository: CustomerRepository,
    @service(CustomerService) protected customerService: CustomerService,
  ) { }

  @get('/customers/{id}/rates/count', {
    description: 'Get count of CustomerRate',
    responses: {
      '200': {
        description: 'CustomerRate model count',
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
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = [ {customer_id: id} ]

    return this.customerRateRepository.count(DataUtils.getWhere(value,
      ['prefix', 'destination', 'inter_rate', 'intra_rate', 'init_duration', 'succ_duration'],
      'inter_rate,intra_rate,init_duration,succ_duration', custom));
  }

  @get('/customers/{id}/rates', {
    responses: {
      '200': {
        description: 'Array of Customer has many CustomerRate',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(CustomerRate)},
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
  ): Promise<CustomerRate[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let include = []
    include.push({relation: 'created'})
    include.push({relation: 'updated'})

    let custom: any[] = [ {customer_id: id} ]

    return this.customerRateRepository.find(DataUtils.getFilter(limit, skip, order, value,
      ['prefix', 'destination', 'inter_rate', 'intra_rate', 'init_duration', 'succ_duration'],
      'inter_rate,intra_rate,init_duration,succ_duration', custom, include));
  }

  @get('/customers/rates/{id}', {
    responses: {
      '200': {
        description: 'CustomerRate',
        content: {
          'application/json': {
            schema: getModelSchemaRef(CustomerRate),
          },
        },
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<CustomerRate> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.customerRateRepository.findById(id)
  }

  @post('/customers/{id}/rates', {
    responses: {
      '200': {
        description: 'Customer Rates model instance',
        content: {'application/json': {schema: getModelSchemaRef(CustomerRate)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: typeof Customer.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerRate, {
            title: 'NewCustomerRateInCustomer',
            exclude: ['id','customer_id','created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    }) customerRate: Omit<CustomerRate, 'id,customer_id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<CustomerRate> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customerRate.prefix=="" || customerRate.destination=="" || customerRate.init_duration<=0 || customerRate.succ_duration<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (customerRate.inter_rate<=0 || customerRate.intra_rate<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const rates = await this.customerRateRepository.findOne({where: {and: [{prefix: customerRate.prefix}, {customer_id: id}]}})
    if (rates)
      throw new HttpErrors.BadRequest("The Rates have same Prefix.")

    customerRate.customer_id = id!

    customerRate.created_by = profile.user.id
    customerRate.created_at = new Date().toISOString()
    customerRate.updated_by = profile.user.id
    customerRate.updated_at = new Date().toISOString()

    return this.customerRepository.customerRates(id).create(customerRate);
  }

  @patch('/customers/rates/{id}', {
    responses: {
      '200': {
        description: 'Customer.CustomerRate PATCH success count',
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
          schema: getModelSchemaRef(CustomerRate, {
            title: 'NewCustomerRateInCustomer',
            exclude: ['id', 'customer_id','created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    })
    customerRate: Omit<CustomerRate, 'id,customer_id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customerRate.prefix=="" || customerRate.destination=="" || customerRate.init_duration<=0 || customerRate.succ_duration<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (customerRate.inter_rate<=0 || customerRate.intra_rate<=0)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const r = await this.customerRateRepository.findById(id);
    if (!r)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const rates = await this.customerRateRepository.findOne({where: {and: [{prefix: customerRate.prefix}, {customer_id: r.customer_id}]}})
    if (rates && rates.id!=id)
      throw new HttpErrors.BadRequest("The Rates have same Prefix already existed.")

    customerRate.updated_by = profile.user.id
    customerRate.updated_at = new Date().toISOString()

    await this.customerRateRepository.updateById(id, customerRate)
  }

  @del('/customers/rates/{id}', {
    responses: {
      '200': {
        description: 'Customer.CustomerRate DELETE success count',
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

    await this.customerRateRepository.deleteById(id)
  }

  @get('/customers/{id}/rates/default', {
    description: 'Get default values of CustomerRate',
    responses: {
      '200': {
        description: 'CustomerRate Default Value',
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

  @post('/customers/{id}/rates/upload', {
    responses: {
      '200': {
        description: 'Customer Rates model instance',
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

    const customer = await this.customerRepository.findById(id)
    if (!customer)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (upload.method=="" || upload.encoded_file=="" || upload.extension=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const filename = TEMPORARY + "rates_"
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

    const defaults = await this.customerService.getDefaultRates(id!)
    if (defaults==null)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    // @ts-ignore
    for (let index=1; index<=worksheet.rowCount; index++)  {
      if (index==1)
        continue

      // @ts-ignore
      let prefix = worksheet.getCell('A'+index).value
      // @ts-ignore
      let destination = worksheet.getCell('B'+index).value
      // @ts-ignore
      let inter_rate = worksheet.getCell('C'+index).value
      // @ts-ignore
      let intra_rate = worksheet.getCell('D'+index).value
      // @ts-ignore
      let init_duration = worksheet.getCell('E'+index).value
      // @ts-ignore
      let succ_duration = worksheet.getCell('F'+index).value

      if (prefix==null || prefix=="" || destination==null || destination=="") {
        const err = "Prefix, Destination is a mandatory field."
        if (!message.includes(err))
          message += err + "\n"
        failed++
        continue
      }

      // initialize with default rates
      if (inter_rate==null || inter_rate=="")
        inter_rate = defaults.rate
      if (intra_rate==null || intra_rate=="")
        intra_rate = defaults.rate
      if (init_duration==null || init_duration=="")
        init_duration = defaults.init_duration
      if (succ_duration==null || succ_duration=="")
        succ_duration = defaults.succ_duration

      let rates = await this.customerRateRepository.findOne({where: {and: [ {customer_id: id, prefix: prefix} ]}})
      if (rates) {
        if (upload.method==UPLOAD_METHOD.APPEND) {
          const err = "Inter/Intra Rates have already existed."
          if (!message.includes(err))
            message += err + "\n"
          failed++
        }
        else if (upload.method==UPLOAD_METHOD.UPDATE) {
          if (destination!=null && destination!="")
            rates.destination = destination

          rates.intra_rate = intra_rate
          rates.inter_rate = inter_rate
          rates.init_duration = init_duration
          rates.succ_duration = succ_duration

          rates.updated_by = profile.user.id
          rates.updated_at = new Date().toISOString()

          await this.customerRateRepository.save(rates)
          completed++
        }
        else if (upload.method==UPLOAD_METHOD.DELETE) {
          await this.customerRateRepository.deleteById(rates.id)
          completed++
        }
      }
      else {
        if (upload.method==UPLOAD_METHOD.DELETE) {
          const err = "Inter/Intra Rates have not existed."
          if (!message.includes(err))
            message += err + "\n"
          failed++
        } else {
          rates = new CustomerRate()
          rates.customer_id = id!

          rates.prefix = prefix
          rates.destination = destination
          rates.intra_rate = intra_rate
          rates.inter_rate = inter_rate
          rates.init_duration = init_duration
          rates.succ_duration = succ_duration

          rates.created_by = profile.user.id
          rates.created_at = new Date().toISOString()
          rates.updated_by = profile.user.id
          rates.updated_at = new Date().toISOString()

          await this.customerRateRepository.create(rates)
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
