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
import {
  Credentials,
  Customer, CustomerBilling,
  CustomerCreateRequest,
  CustomerInfo,
  CustomerPasswordUpdateRequest, CustomerProduct, TfnNumber,
  UserInfo, UserPasswordUpdateRequest, UserUISettingsRequest,
} from '../models';
import {
  CredentialsRepository,
  CustomerRateRepository,
  CustomerRepository,
  CustomerResourceGroupRepository, StatementRepository, TfnNumberRepository,
} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';
import {RATE_TYPE, SUPER_ADMIN_ROLE, USER_TYPE} from '../constants/configurations';
import {genSalt, hash} from 'bcryptjs';
import {RoleService} from '../services';
import { UserRepository } from '@loopback/authentication-jwt';

@authenticate('jwt')
export class CustomerController {
  constructor(
    @repository(CustomerRepository) public customerRepository : CustomerRepository,
    @repository(UserRepository) public userRepository : UserRepository,
    @repository(CredentialsRepository) public credentialsRepository : CredentialsRepository,
    @repository(CustomerResourceGroupRepository) public customerResourceGroupRepository : CustomerResourceGroupRepository,
    @repository(CustomerRateRepository) public customerRateRepository : CustomerRateRepository,
    @repository(TfnNumberRepository) public tfnNumberRepository : TfnNumberRepository,
    @repository(StatementRepository) public statementRepository : StatementRepository,
    @service(RoleService) public roleService : RoleService,
  ) {}

  @post('/customers')
  @response(200, {
    description: 'Customer model instance',
    content: {'application/json': {schema: getModelSchemaRef(Customer)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerCreateRequest, {
            title: 'NewCustomer',
            exclude: [],
          }),
        },
      },
    })
    req: Omit<CustomerCreateRequest, ''>,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Customer> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (req.company_id=="" || req.company_name=="" || req.billing_email==""
      || req.billing_method=="" || req.billing_start==""
      || req.first_name=="" || req.last_name=="" || req.email=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    let cus = await this.customerRepository.findOne({where: {company_id: req.company_id}})
    if (cus)
      throw new HttpErrors.BadRequest("Customer have already existed. Please use different Company ID.");

    cus = await this.customerRepository.findOne({where: {company_name: req.company_name}})
    if (cus)
      throw new HttpErrors.BadRequest("Customer have already existed. Please use different Company Name.");

    const tx = await this.customerRepository.beginTransaction()

    let customer = new Customer()
    customer.type = USER_TYPE.CUSTOMER
    customer.company_id = req.company_id
    customer.company_name = req.company_name
    customer.first_name = req.first_name
    customer.last_name = req.last_name
    customer.email = req.email
    customer.status = req.status
    customer.rate_type = req.rate_type
    customer.flat_rate = req.flat_rate
    customer.default_rate = req.default_rate
    customer.init_duration = req.init_duration
    customer.succ_duration = req.succ_duration

    customer.created_by = profile.user.id
    customer.updated_by = profile.user.id
    customer.created_at = new Date().toISOString()
    customer.updated_at = new Date().toISOString()

    customer = await this.customerRepository.create(customer);

    let billing = new CustomerBilling()
    billing.email = req.billing_email
    billing.method = req.billing_method
    billing.start = req.billing_start
    if (req.billing_cycle)
      billing.cycle = req.billing_cycle

    billing.created_by = profile.user.id
    billing.updated_by = profile.user.id
    billing.created_at = new Date().toISOString()
    billing.updated_at = new Date().toISOString()

    billing = await this.customerRepository.customerBilling(customer.id).create(billing)

    let info = new CustomerInfo()
    info.created_by = profile.user.id
    info.updated_by = profile.user.id
    info.created_at = new Date().toISOString()
    info.updated_at = new Date().toISOString()

    info = await this.customerRepository.customerInfo(customer.id).create(info)

    await tx.commit()

    return customer
  }

  @get('/customers/count')
  @response(200, {
    description: 'Customer model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('value') value: string
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let fields = ['company_id','company_name','first_name','last_name', 'email'];
    let num_fields = undefined;
    let custom = [{type: USER_TYPE.CUSTOMER}]
    return this.customerRepository.count(DataUtils.getWhere(value, fields, num_fields, custom));
  }

  @get('/customers')
  @response(200, {
    description: 'Array of Customer model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Customer, {includeRelations: true}),
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
  ): Promise<Customer[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let fields = ['company_id','company_name','first_name','last_name', 'email'];
    let num_fields = undefined;
    let custom = [{type: USER_TYPE.CUSTOMER}]
    let include = []
    include.push({relation: 'created'})
    include.push({relation: 'updated'})
    include.push({relation: 'customerInfo'})
    include.push({relation: 'customerBilling'})

    return this.customerRepository.find(DataUtils.getFilter(limit, skip, order, value, fields, num_fields, custom, include));
  }

  @get('/customers/{id}')
  @response(200, {
    description: 'Customer model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Customer, {includeRelations: true}),
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) && !profile.permissions.includes(PERMISSIONS.READ_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let include: any[] = [];
    include.push({relation: 'customerInfo'})
    include.push({relation: 'customerBilling'})
    include.push({relation: 'customerProduct'})

    const customer: any = await this.customerRepository.findById(id, {include: include});
    if (customer.allowed) {
      const credentials = await this.credentialsRepository.findOne({fields: ['username'], where: { and: [ { type: USER_TYPE.CUSTOMER }, { user_id: customer.id } ]}})
      if (credentials)
        return { ...customer, credentials }
    }

    return customer
  }

  @patch('/customers/{id}/general')
  @response(204, {
    description: 'Customer PATCH success',
  })
  async updateGeneral(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {
            title: 'NewGeneralCustomer',
            exclude: ['id', 'type', 'allowed', 'ui_settings', 'default_rate', 'rate_type', 'init_duration', 'succ_duration', 'flat_rate', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
    customer: Omit<Customer, 'id,type,allowed,ui_settings,default_rate,rate_type,init_duration,succ_duration,flat_rate,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) && !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customer.company_id=="" || customer.company_name==""
      || customer.first_name=="" || customer.last_name=="" || customer.email=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    let cus = await this.customerRepository.findOne({where: {company_id: customer.company_id}})
    if (cus && cus.id!=id)
      throw new HttpErrors.BadRequest("Customer have already existed. Please use different Company ID.");

    cus = await this.customerRepository.findOne({where: {company_name: customer.company_name}})
    if (cus && cus.id!=id)
      throw new HttpErrors.BadRequest("Customer have already existed. Please use different Company Name.");

    customer.updated_by = profile.user.id
    customer.updated_at = new Date().toISOString()

    await this.customerRepository.updateById(id, customer);
  }

  @patch('/customers/{id}/rates')
  @response(204, {
    description: 'Customer PATCH success',
  })
  async updateRates(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {
            title: 'NewRatesCustomer',
            exclude: ['id', 'type', 'allowed', 'ui_settings', 'company_id', 'company_name', 'first_name', 'last_name', 'email', 'status', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
      customer: Omit<Customer, 'id,type,allowed,ui_settings,company_id,company_name,first_name,last_name,email,status,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) && !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customer.rate_type=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    customer.updated_by = profile.user.id
    customer.updated_at = new Date().toISOString()

    await this.customerRepository.updateById(id, customer);
  }

  @patch('/customers/{id}/billing')
  @response(204, {
    description: 'Customer PATCH success',
  })
  async updateBilling(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerBilling, {
            title: 'NewCustomerBilling',
            exclude: ['id', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
      customer: Omit<CustomerBilling, 'id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) && !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let billing;
    try {
      billing = await this.customerRepository.customerBilling(id).get()
    } catch (err) {
    }

    if (billing) {

    } else {
      customer.created_by = profile.user.id
      customer.created_at = new Date().toISOString()
    }

    customer.updated_by = profile.user.id
    customer.updated_at = new Date().toISOString()

    billing ? await this.customerRepository.customerBilling(id).patch(customer) : await this.customerRepository.customerBilling(id).create(customer)
  }

  @patch('/customers/{id}/password', {
    description: 'Update customer password',
    responses: {
      '204': {
        description: 'Customer PATCH success',
      }
    }
  })
  async updatePassword(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: "object",
            properties: {
              username: {
                type: 'string',
                nullable: true,
              },
              new_password: {
                type: 'string',
                nullable: true,
              },
              confirm_password: {
                type: 'string',
                nullable: true,
              },
              allowed: {
                type: 'boolean'
              },
            },
            required: ['allowed']
          },
        },
      },
    })
      password: CustomerPasswordUpdateRequest, @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) &&  !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (password.allowed && (password.username=="" || password.new_password==""))
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (password.allowed) {
      const already = await this.credentialsRepository.findOne({where: {username: password.username}})
      let credentials = await this.credentialsRepository.findOne({where: {type: USER_TYPE.CUSTOMER, user_id: id}})

      if (already) {
        if (credentials)
          if (credentials.id!=already.id)
            throw new HttpErrors.BadRequest(MESSAGES.INVALID_USERNAME)
        else
          throw new HttpErrors.BadRequest(MESSAGES.INVALID_USERNAME)
      }

      let isNew = false
      if (!credentials) {
        credentials = new Credentials()
        credentials.type = USER_TYPE.CUSTOMER
        credentials.user_id = id
        credentials.username = password.username!

        credentials.created_at = new Date().toISOString()
        credentials.created_by = profile.user.id

        isNew = true
      } else {
        credentials.username = password.username!
      }

      credentials.salt = await genSalt()
      credentials.password = await hash(password.new_password!, credentials.salt)

      credentials.updated_by = profile.user.id
      credentials.updated_at = new Date().toISOString()

      credentials = isNew ? await this.credentialsRepository.create(credentials) : await this.credentialsRepository.save(credentials)
    } else {
    }

    await this.customerRepository.updateById(id, {allowed: password.allowed})
  }

  @patch('/customers/{id}/additional')
  @response(204, {
    description: 'Customer PATCH success',
  })
  async updateAdditional(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerInfo, {
            title: 'NewAdditionalCustomer',
            exclude: ['id', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
      customer: Omit<CustomerInfo, 'id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) && !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let additional;
    try {
      additional = await this.customerRepository.customerInfo(id).get()
    } catch (err) {
    }

    if (additional) {

    } else {
      customer.created_by = profile.user.id
      customer.created_at = new Date().toISOString()
    }

    customer.updated_by = profile.user.id
    customer.updated_at = new Date().toISOString()

    additional ? await this.customerRepository.customerInfo(id).patch(customer) : await this.customerRepository.customerInfo(id).create(customer)
  }

  @del('/customers/{id}')
  @response(204, {
    description: 'Customer DELETE success',
  })
  async deleteById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    // TODO - check all foreign keys
    const user = await this.userRepository.findOne({where: {customer_id: id}})
    if (user)
      throw new HttpErrors.BadRequest("There are some users using this customer.")

    const rg = await this.customerResourceGroupRepository.findOne({where: { customer_id: id }})
    if (rg)
      throw new HttpErrors.BadRequest("There are some Resource Groups in this customer. Please try again after remove all RGs.")

    const rate = await this.customerRateRepository.findOne({where: {customer_id: id}})
    if (rate)
      throw new HttpErrors.BadRequest("There are some INTER/INTRA Rates in this customer. Please try again after remove all Rates.")

    const tfn = await this.tfnNumberRepository.findOne({where: {customer_id: id}})
    if (tfn)
      throw new HttpErrors.BadRequest("There are some TFN Numbers assigned to this customer.")

    const stmt = await this.statementRepository.findOne({where: {customer_id: id}})
    if (stmt)
      throw new HttpErrors.BadRequest("There are some Statements in this customer.")

    const tx = await this.customerRepository.beginTransaction()

    await this.customerRepository.customerBilling(id).delete()
    await this.customerRepository.customerInfo(id).delete()
    await this.customerRepository.customerProduct(id).delete()
    await this.credentialsRepository.deleteAll({and: [ {user_id: id}, {type: USER_TYPE.CUSTOMER} ]})
    await this.customerRepository.deleteById(id);

    await tx.commit();
  }

  @get('/customers/for_filter', {
    description: 'Get customers without checking permission',
    responses: {
      '200': {
        description: 'Array of Customer model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Customer, {includeRelations: true}),
            },
          },
        },
      }
    }
  })
  async forFilter(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Customer[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    return this.customerRepository.find({where: {type: USER_TYPE.CUSTOMER}});
  }

  @get('/customers/for_filter_all', {
    description: 'Get customers without checking permission',
    responses: {
      '200': {
        description: 'Array of Customer model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Customer, {includeRelations: true}),
            },
          },
        },
      }
    }
  })
  async for_filter_all(
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Customer[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    return this.customerRepository.find({});
  }

  @patch('/customers/{id}/roles')
  @response(200, {
    description: 'Roles PATCH success',
  })
  async createDefaultRoles(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const customer: any = await this.customerRepository.findById(id);
    if (!customer)
      throw new HttpErrors.BadRequest("No Customer")

    await this.roleService.createDefaultRoles(customer)
  }


  @get('/customers/{id}/tfn-numbers_count')
  @response(200, {
    description: 'TfnNumber model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async tfnnumber_count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.query.string('value') value: string,
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) && !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let customs = [{customer_id: id}]
    // let conditions = { or: [ {customer_id: id}, {customer_id: {eq: 0}} ]}

    return this.tfnNumberRepository.count(DataUtils.getWhere(value,
      ['tfn_num', 'trans_num', 'resp_org', 'price'],
      'tfn_num,trans_num,price', customs));
  }

  @get('/customers/{id}/tfn-numbers')
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
  async tfnnumbers_find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @param.query.number('limit') limit: number,
    @param.query.number('skip') skip: number,
    @param.query.string('order') order: string,
    @param.query.string('value') value: string,
  ): Promise<TfnNumber[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) && !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let customs = [{customer_id: id}]
    // let conditions = { or: [ {customer_id: id}, {customer_id: {eq: 0}} ]}

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
      'tfn_num,trans_num,price', customs, include));
  }

  @patch('/customers/{id}/product')
  @response(204, {
    description: 'Customer PATCH success',
  })
  async updateProduct(
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(CustomerProduct, {
              title: 'NewCustomerProduct',
              exclude: ['id','created_at', 'updated_at'],
            }),
          },
        },
      })
          customer: Omit<CustomerProduct, 'id,created_at,updated_at'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (profile.type!=USER_TYPE.USER || profile.user.role_id!=SUPER_ADMIN_ROLE)
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let product;
    try {
      product = await this.customerRepository.customerProduct(id).get()
    } catch (err) {
    }

    if (product) {

    } else {
      customer.created_at = new Date().toISOString()
    }

    customer.updated_at = new Date().toISOString()

    product ? await this.customerRepository.customerProduct(id).patch(customer) : await this.customerRepository.customerProduct(id).create(customer)
  }

  @patch('/customers/{id}/ui_settings', {
    description: 'Update customer ui settings',
    responses: {
      '204': {
        description: 'User PATCH success',
      }
    }
  })
  async updateUISettings(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {
                ui_settings: {
                  type: "string",
                },
              }
            },
          },
        },
      })
          user: UserUISettingsRequest, @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) &&  !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.customerRepository.updateById(id, {
      ui_settings: user.ui_settings,
      // updated_by: profile.user.id,
      updated_at: new Date().toISOString()
    });
  }

  @patch('/customers/{id}/account_password', {
    description: 'Update customer password',
    responses: {
      '204': {
        description: 'User PATCH success',
      }
    }
  })
  async updateAccountPassword(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {
                old_password: {
                  type: 'string',
                },
                new_password: {
                  type: 'string',
                },
              }
            },
          },
        },
      })
          password: UserPasswordUpdateRequest, @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!(profile.type==USER_TYPE.CUSTOMER && id==profile.user.id) &&  !profile.permissions.includes(PERMISSIONS.WRITE_CUSTOMERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const user = await this.credentialsRepository.findOne({where: {and: [ {type: USER_TYPE.CUSTOMER, user_id: id} ]}})
    if (!user)
      throw new HttpErrors.BadRequest("credentials.password' is null")

    if (id == profile.user.id) {
      if (password.old_password) {
        const old_password_hash = await hash(password.old_password, user.salt);
        if (old_password_hash!=user.password)
          throw new HttpErrors.BadRequest("old password is wrong!")
      } else {
        throw new HttpErrors.BadRequest("old password is wrong!")
      }
    }

    user.salt = await genSalt()
    user.password = await hash(password.new_password, user.salt)

    user.updated_by = profile.user.id
    user.updated_at = new Date().toISOString()
    await this.credentialsRepository.save(user)
  }

}
