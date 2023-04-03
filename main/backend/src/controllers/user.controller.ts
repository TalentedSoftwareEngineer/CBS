import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository, Transaction,
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
  User,
  UserCreateRequest,
  UserInfo,
  UserPasswordUpdateRequest,
  UserUISettingsRequest,
} from '../models';
import {CredentialsRepository, UserInfoRepository, UserRepository} from '../repositories';
import {authenticate, TokenService} from "@loopback/authentication";
import {inject} from "@loopback/core";
import {SecurityBindings, securityId, UserProfile} from "@loopback/security";
import AuditionedUtils from "../utils/audition";
import {hash, genSalt} from "bcryptjs";
import {PERMISSIONS} from "../constants/permissions";
import {MESSAGES} from "../constants/messages";
import DataUtils from '../utils/data';
import {USER_TYPE} from '../constants/configurations';

@authenticate('jwt')
export class UserController {
  constructor(
    @repository(CredentialsRepository)
    private credentialsRepository: CredentialsRepository,
    @repository(UserRepository)
    public userRepository : UserRepository,
  ) {}

  @post('/users', {
    description: 'Create user',
    responses: {
      '200': {
        description: 'User model instance',
        content: {'application/json': {schema: getModelSchemaRef(User)}},
      },
      '400': {
        description: 'Username is already existed',
      }
    }
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: "object",
            properties: {
              username: {
                type: "string",
              },
              email: {
                type: "string",
              },
              first_name: {
                type: "string",
              },
              last_name: {
                type: "string",
              },
              customer_id: {
                type: "integer",
              },
              role_id: {
                type: "integer",
              },
              password: {
                type: "string",
              },
              country: {
                type: "string",
              },
              address: {
                type: "string",
              },
              province: {
                type: "string",
              },
              city: {
                type: "string",
              },
              zip_code: {
                type: "string",
              },
              tel1: {
                type: "string",
              },
              tel2: {
                type: "string",
              },
              mobile: {
                type: "string",
              },
              fax: {
                type: "string",
              }
            },
            required: ["username", "email", "first_name", "last_name", "customer_id", "role_id", "password"]
          },
        },
      },
    })
      req: UserCreateRequest, @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const tx = await this.userRepository.beginTransaction()

    const user_already = await this.credentialsRepository.findOne({where: {username: req.username}})
    if (user_already)
      throw new HttpErrors.BadRequest("Username is already existed. Please try with another one!")

    const user = new User()
    user.username = req.username
    user.email = req.email
    user.first_name = req.first_name
    user.last_name = req.last_name
    user.customer_id = req.customer_id
    user.role_id = req.role_id
    user.created_by = profile.user.id
    user.created_at = new Date().toISOString()
    user.updated_by = profile.user.id
    user.updated_at = new Date().toISOString()
    user.status = false
    const new_user = await this.userRepository.create(user);

    const user_credentials = new Credentials()
    // user_credentials.id = new_user.id
    user_credentials.type = USER_TYPE.USER
    user_credentials.username = user.username
    user_credentials.user_id = new_user.id!

    user_credentials.salt = await genSalt()
    user_credentials.password = await hash(req.password, user_credentials.salt);

    user_credentials.created_by = profile.user.id
    user_credentials.created_at = new Date().toISOString()
    user_credentials.updated_by = profile.user.id
    user_credentials.updated_at = new Date().toISOString()
    const new_user_credentials = await this.credentialsRepository.create(user_credentials)

    const info = new UserInfo()
    // user_info.id = new_user.id
    info.country = req.country
    info.address = req.address
    info.province = req.province
    info.city = req.city
    info.zip_code = req.zip_code
    info.tel1 = req.tel1
    info.tel2 = req.tel2
    info.mobile = req.mobile
    info.fax = req.fax
    info.created_by = profile.user.id
    info.created_at = new Date().toISOString()
    info.updated_by = profile.user.id
    info.updated_at = new Date().toISOString()
    const new_user_info = await this.userRepository.userInfo(new_user.id).create(info)

    await tx.commit()
    return new_user
  }

  @get('/users/count', {
    description: 'Get count of users',
    responses: {
      '200': {
        description: 'User model count',
        content: {'application/json': {schema: CountSchema}},
      }
    }
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('value') value: string,
    @param.query.string('roleFilterId') roleFilterId: string,
    @param.query.string('statusFilter') statusFilter: string
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let tmpRoleFilterId = roleFilterId=='' ? undefined : roleFilterId;
    let tmpStatusFilter = statusFilter=='' ? undefined : statusFilter;

    let fields = ['username','first_name','last_name','email'];
    let num_fields = undefined;
    let custom = [{role_id: tmpRoleFilterId}, {status: tmpStatusFilter}];
    return this.userRepository.count(DataUtils.getWhere(value, fields, num_fields, custom));
  }

  @get('/users', {
    description: 'Get users',
    responses: {
      '200': {
        description: 'Array of User model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User, {includeRelations: true}),
            },
          },
        },
      }
    }
  })
  async find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.number('limit') limit: number,
    @param.query.number('skip') skip: number,
    @param.query.string('order') order: string,
    @param.query.string('value') value: string,
    @param.query.string('roleFilterId') roleFilterId: string,
    @param.query.string('statusFilter') statusFilter: string
  ): Promise<User[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let tmpRoleFilterId = roleFilterId=='' ? undefined : roleFilterId;
    let tmpStatusFilter = statusFilter=='' ? undefined : statusFilter;

    let fields = ['username','first_name','last_name','email'];
    let num_fields = undefined;
    let custom = [{role_id: tmpRoleFilterId}, {status: tmpStatusFilter}];
    let include: any[] = [{
      relation: 'role',
      scope: {
        fields: { name: true }
      }
    }];
    include.push({
      relation: 'customer',
      scope: {
        fields: ['company_id', 'company_name', 'first_name', 'last_name']
      }
    })
    include.push({relation: 'userInfo'})

    return this.userRepository.find(DataUtils.getFilter(limit, skip, order, value, fields, num_fields, custom, include));
  }

  @get('/users/{id}', {
    description: 'Get user',
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User, {includeRelations: true}),
          },
        },
      }
    }
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    // @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (id!=profile.user.id && !profile.permissions.includes(PERMISSIONS.READ_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let include = []
    include.push({relation: 'customer'})
    include.push({relation: 'role'})
    include.push({relation: 'userInfo'})

    return this.userRepository.findById(id, {include: include});
  }

  @get('/users/{id}/auditioned', {
    description: 'Get user details for auditioned',
    responses: {
      '200': {
        description: 'User model instance',
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {
                username: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                first_name: {
                  type: 'string',
                },
                last_name: {
                  type: 'string',
                },
              }
            },
          },
        },
      }
    }
  })
  async getAuditionedById(
    @param.path.number('id') id: number,
    // @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, {fields: { email: true, username: true, first_name: true, last_name: true}});
  }

  @patch('/users/{id}/primary', {
    description: 'Update primary user information',
    responses: {
      '204': {
        description: 'User PATCH success',
      }
    }
  })
  async updatePrimaryInformation(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'PrimaryUser',
            exclude: ['id', 'created_by', 'created_at', 'updated_by', 'updated_at', 'status', 'ui_settings'],
          }),
        },
      },
    })
      user: Omit<User, 'id,created_at,created_by,updated_at,updated_by,status,ui_settings'>, @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (id!=profile.user.id && !profile.permissions.includes(PERMISSIONS.WRITE_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const already = await this.credentialsRepository.findOne({where: {username: user.username}})
    const usr = await this.credentialsRepository.findOne({where: { and: [ {type: USER_TYPE.USER, user_id: id} ]}})
    if (already && usr && already.id!=usr.id)
      throw new HttpErrors.BadRequest("Username is already existed. Please try with another one!")

    user.updated_by = profile.user.id
    user.updated_at = new Date().toISOString()
    await this.userRepository.updateById(id, user);
  }

  @patch('/users/{id}/ui_settings', {
    description: 'Update user ui settings',
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
    if (id!=profile.user.id && !profile.permissions.includes(PERMISSIONS.WRITE_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.userRepository.updateById(id, {
      ui_settings: user.ui_settings,
      updated_by: profile.user.id,
      updated_at: new Date().toISOString()
    });
  }

  @patch('/users/{id}/additional', {
    description: 'Update additional user information',
    responses: {
      '204': {
        description: 'User PATCH success',
      }
    }
  })
  async updateAdditionalInformation(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(UserInfo, {
            title: 'AdditionalUser',
            exclude: ['id', 'created_by', 'created_at', 'updated_by', 'updated_at'],
          }),
        },
      },
    })
      user: Omit<UserInfo, 'id,created_at,created_by,updated_at,updated_by'>, @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (id!=profile.user.id && !profile.permissions.includes(PERMISSIONS.WRITE_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    user.updated_by = profile.user.id
    user.updated_at = new Date().toISOString()
    await this.userRepository.userInfo(id).patch(user)
  }

  @patch('/users/{id}/password', {
    description: 'Update user password',
    responses: {
      '204': {
        description: 'User PATCH success',
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
    if (id!=profile.user.id && !profile.permissions.includes(PERMISSIONS.WRITE_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const user = await this.credentialsRepository.findOne({where: {and: [ {type: USER_TYPE.USER, user_id: id} ]}})
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

  @patch('/users/{id}/status', {
    description: 'Update user password',
    responses: {
      '204': {
        description: 'User PATCH success',
      }
    }
  })
  async updateStatus(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (id!=profile.user.id && !profile.permissions.includes(PERMISSIONS.WRITE_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const user = await this.userRepository.findById(id)
    if (!user)
      throw new HttpErrors.BadRequest("invalid user")

    user.status = !user.status
    user.updated_by = profile.user.id
    user.updated_at = new Date().toISOString()

    await this.userRepository.updateById(id, user)
  }

  @del('/users/{id}', {
    description: 'Delete user',
    responses: {
      '204': {
        description: 'User DELETE success',
      }
    }
  })
  async deleteById(@param.path.number('id') id: number, @inject(SecurityBindings.USER) currentUserProfile: UserProfile): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_USERS))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const tx = await this.userRepository.beginTransaction()

    // TODO - check all foreign key of user_id
    await this.userRepository.userInfo(id).delete()
    await this.credentialsRepository.deleteAll({and: [ {user_id: id}, {type: USER_TYPE.USER} ]})
    await this.userRepository.deleteById(id);

    await tx.commit();
  }

  @get('/users/for_filter', {
    description: 'Get users without checking permission',
    responses: {
      '200': {
        description: 'Array of User model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(User, {includeRelations: true}),
            },
          },
        },
      }
    }
  })
  async forFilter(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<User[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    return this.userRepository.find({});
  }

}
