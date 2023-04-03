// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {authenticate} from '@loopback/authentication';
import {Count, CountSchema, repository} from '@loopback/repository';
import {
  CredentialsRepository,
  CustomerRateRepository,
  CustomerRepository,
  CustomerResourceGroupRepository,
} from '../repositories';
import {inject, service} from '@loopback/core';
import {RoleService} from '../services';
import {del, get, getModelSchemaRef, HttpErrors, param, patch, post, requestBody, response} from '@loopback/rest';
import {
  Credentials,
  Customer,
  CustomerBilling,
  CustomerCreateRequest,
  CustomerInfo,
  CustomerPasswordUpdateRequest,
} from '../models';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import {RATE_TYPE, USER_TYPE} from '../constants/configurations';
import DataUtils from '../utils/data';
import {genSalt, hash} from 'bcryptjs';

@authenticate('jwt')
export class VendorController {
  constructor(
    @repository(CustomerRepository)
    public customerRepository : CustomerRepository,
    @repository(CredentialsRepository)
    public credentialsRepository : CredentialsRepository,
    @repository(CustomerResourceGroupRepository)
    public customerResourceGroupRepository : CustomerResourceGroupRepository,
    @repository(CustomerRateRepository)
    public customerRateRepository : CustomerRateRepository,
    @service(RoleService)
    public roleService : RoleService,
  ) {}

  @post('/vendors')
  @response(200, {
    description: 'Vendor model instance',
    content: {'application/json': {schema: getModelSchemaRef(Customer)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerCreateRequest, {
            title: 'NewVendor',
            exclude: [],
          }),
        },
      },
    })
      req: Omit<CustomerCreateRequest, ''>,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<Customer> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (req.company_id=="" || req.company_name=="" || req.billing_email==""
      || req.billing_method=="" || req.billing_start==""
      || req.first_name=="" || req.last_name=="" || req.email=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    let cus = await this.customerRepository.findOne({where: {company_id: req.company_id}})
    if (cus)
      throw new HttpErrors.BadRequest("Vendor have already existed. Please use different Company ID.");

    cus = await this.customerRepository.findOne({where: {company_name: req.company_name}})
    if (cus)
      throw new HttpErrors.BadRequest("Vendor have already existed. Please use different Company Name.");

    const tx = await this.customerRepository.beginTransaction()

    let customer = new Customer()
    customer.type = USER_TYPE.VENDOR
    customer.company_id = req.company_id
    customer.company_name = req.company_name
    customer.first_name = req.first_name
    customer.last_name = req.last_name
    customer.email = req.email
    customer.status = req.status
    customer.rate = req.rate
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

  @get('/vendors/count')
  @response(200, {
    description: 'Vendor model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('value') value: string
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let fields = ['company_id','company_name','first_name','last_name', 'email'];
    let num_fields = undefined;
    let custom = undefined;
    return this.customerRepository.count(DataUtils.getWhere(value, fields, num_fields, custom));
  }

  @get('/vendors')
  @response(200, {
    description: 'Array of Vendor model instances',
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
    if (!profile.permissions.includes(PERMISSIONS.READ_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let fields = ['company_id','company_name','first_name','last_name', 'email'];
    let num_fields = undefined;
    let custom = undefined;
    let include = []
    include.push({relation: 'created'})
    include.push({relation: 'updated'})
    include.push({relation: 'customerInfo'})
    include.push({relation: 'customerBilling'})

    return this.customerRepository.find(DataUtils.getFilter(limit, skip, order, value, fields, num_fields, custom, include));
  }

  @get('/vendors/{id}')
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
    if (!profile.permissions.includes(PERMISSIONS.READ_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let include: any[] = [];
    include.push({relation: 'customerInfo'})
    include.push({relation: 'customerBilling'})

    const customer: any = await this.customerRepository.findById(id, {include: include});
    if (customer.allowed) {
      const credentials = await this.credentialsRepository.findOne({fields: ['username'], where: { and: [ { type: USER_TYPE.VENDOR }, { user_id: customer.id } ]}})
      if (credentials)
        return { ...customer, credentials }
    }

    return customer
  }

  @patch('/vendors/{id}/general')
  @response(204, {
    description: 'Vendor PATCH success',
  })
  async updateGeneral(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {
            title: 'NewVendor',
            exclude: ['id', 'type', 'allowed', 'settings', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
      customer: Omit<Customer, 'id,type,allowed,settings,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
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

  @patch('/vendors/{id}/billing')
  @response(204, {
    description: 'Vendor PATCH success',
  })
  async updateBilling(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerBilling, {
            title: 'NewVendorBilling',
            exclude: ['id', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
      customer: Omit<CustomerBilling, 'id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    customer.updated_by = profile.user.id
    customer.updated_at = new Date().toISOString()

    await this.customerRepository.customerBilling(id).patch(customer);
  }

  @patch('/vendors/{id}/password', {
    description: 'Update vendor password',
    responses: {
      '204': {
        description: 'Vendor PATCH success',
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
    if (id!=profile.user.id && !profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (password.allowed && (password.username=="" || password.new_password==""))
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (password.allowed) {
      const already = await this.credentialsRepository.findOne({where: {username: password.username}})
      let credentials = await this.credentialsRepository.findOne({where: {type: USER_TYPE.VENDOR, user_id: id}})

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
        credentials.type = USER_TYPE.VENDOR
        credentials.user_id = id
        credentials.username = password.username!

        credentials.created_at = new Date().toISOString()
        credentials.created_by = profile.user.id

        isNew = true
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

  @patch('/vendors/{id}/additional')
  @response(204, {
    description: 'Vendor PATCH success',
  })
  async updateAdditional(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CustomerInfo, {
            title: 'NewAdditionalVendor',
            exclude: ['id', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
      customer: Omit<CustomerInfo, 'id,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    customer.updated_by = profile.user.id
    customer.updated_at = new Date().toISOString()

    await this.customerRepository.customerInfo(id).patch(customer)
  }

  @del('/vendors/{id}')
  @response(204, {
    description: 'Vendor DELETE success',
  })
  async deleteById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    // TODO - check all foreign keys
    const rg = await this.customerResourceGroupRepository.findOne({where: { customer_id: id }})
    if (rg)
      throw new HttpErrors.BadRequest("There are some Resource Groups in this customer. Please try again after remove all RGs.")

    const rate = await this.customerRateRepository.findOne({where: {customer_id: id}})
    if (rate)
      throw new HttpErrors.BadRequest("There are some INTER/INTRA Rates in this customer. Please try again after remove all Rates.")

    const tx = await this.customerRepository.beginTransaction()

    await this.customerRepository.customerInfo(id).delete()
    await this.credentialsRepository.deleteAll({and: [ {user_id: id}, {type: USER_TYPE.VENDOR} ]})
    await this.customerRepository.deleteById(id);

    await tx.commit();
  }

  @get('/vendors/for_filter', {
    description: 'Get vendors without checking permission',
    responses: {
      '200': {
        description: 'Array of Vendor model instances',
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
    return this.customerRepository.find({where: {type: USER_TYPE.VENDOR}});
  }

  @patch('/vendors/{id}/roles')
  @response(200, {
    description: 'Roles PATCH success',
  })
  async createDefaultRoles(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_VENDORS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const customer: any = await this.customerRepository.findById(id);
    if (!customer)
      throw new HttpErrors.BadRequest("No Vendor")

    await this.roleService.createDefaultRoles(customer)
  }

}
