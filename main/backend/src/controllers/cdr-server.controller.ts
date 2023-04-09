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
import {CdrServer} from '../models';
import {CdrServerRepository, ConfigurationRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';
import {mkdirSync} from 'fs';
import {CONFIGURATIONS} from '../constants/configurations';

@authenticate('jwt')
export class CdrServerController {
  constructor(
    @repository(CdrServerRepository) public cdrServerRepository : CdrServerRepository,
    @repository(ConfigurationRepository) public configurationRepository : ConfigurationRepository,
  ) {}

  @post('/cdr-servers')
  @response(200, {
    description: 'CdrServer model instance',
    content: {'application/json': {schema: getModelSchemaRef(CdrServer)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CdrServer, {
            title: 'NewCdrServer',
            exclude: ['id','created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    })
    cdrServer: Omit<CdrServer, 'id,created_at,created_by,updated_at,updated_by'>,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<CdrServer> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CDR_SERVER_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (cdrServer.name=="" || cdrServer.address=="" || cdrServer.username=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const server: any = await this.cdrServerRepository.findOne({where: {name: cdrServer.name}})
    if (server)
      throw new HttpErrors.BadRequest("The same server have already existed.")

    const CDR_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.CDR_HOME);
    const fs = require('fs')
    if (!fs.existsSync(CDR_HOME + "/" + cdrServer.name)) {
      try {
        fs.mkdirSync(CDR_HOME + "/" + cdrServer.name, 777)
      } catch (err) {
        throw new HttpErrors.BadRequest(err?.message)
      }
    }

    if (cdrServer.path.endsWith("/"))
      cdrServer.path = cdrServer.path.substring(0, cdrServer.path.length-1)
    cdrServer.table_name = cdrServer.table_name?.toLowerCase()

    cdrServer.created_at = new Date().toISOString()
    cdrServer.created_by = profile.user.id
    cdrServer.updated_at = new Date().toISOString()
    cdrServer.updated_by = profile.user.id

    return this.cdrServerRepository.create(cdrServer);
  }

  @get('/cdr-servers/count')
  @response(200, {
    description: 'CdrServer model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('value') value: string,
  ): Promise<Count> {
    return this.cdrServerRepository.count(DataUtils.getWhere(value,
      ['name', 'address', 'username', 'lnp_server', 'port'],
      'port', undefined));
  }

  @get('/cdr-servers')
  @response(200, {
    description: 'Array of CdrServer model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CdrServer, {includeRelations: true}),
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
  ): Promise<CdrServer[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_CDR_SERVER_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let include = []
    include.push({relation: 'created'})
    include.push({relation: 'updated'})

    return this.cdrServerRepository.find(DataUtils.getFilter(limit, skip, order, value,
      ['name', 'address', 'username', 'lnp_server', 'port'],
      'port', undefined, include));
  }

  @get('/cdr-servers/{id}')
  @response(200, {
    description: 'CdrServer model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CdrServer, {includeRelations: true}),
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<CdrServer> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_CDR_SERVER_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.cdrServerRepository.findById(id, {});
  }

  @patch('/cdr-servers/{id}')
  @response(204, {
    description: 'CdrServer PATCH success',
  })
  async updateById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CdrServer, {
            title: 'UpdateCdrServer',
            exclude: ['id', 'table_name', 'created_at', 'created_by', 'updated_at', 'updated_by'],
          }),
        },
      },
    })
      cdrServer: Omit<CdrServer, 'id,name,created_at,created_by,updated_at,updated_by'>,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CDR_SERVER_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    const server: any = await this.cdrServerRepository.findOne({where: {name: cdrServer.name}})
    if (server && server.id!=id)
      throw new HttpErrors.BadRequest("The same server have already existed.")

    const CDR_HOME = await this.configurationRepository.getConfig(CONFIGURATIONS.CDR_HOME);
    const fs = require('fs')
    if (!fs.existsSync(CDR_HOME + "/" + cdrServer.table_name)) {
      try {
        fs.mkdirSync(CDR_HOME + "/" + cdrServer.table_name, 777)
      } catch (err) {
        throw new HttpErrors.BadRequest(err?.message)
      }
    }

    if (cdrServer.path.endsWith("/"))
      cdrServer.path = cdrServer.path.substring(0, cdrServer.path.length-1)
    cdrServer.table_name = cdrServer.table_name?.toLowerCase()

    cdrServer.updated_at = new Date().toISOString()
    cdrServer.updated_by = profile.user.id

    await this.cdrServerRepository.updateById(id, cdrServer);
  }


  @del('/cdr-servers/{id}')
  @response(204, {
    description: 'CdrServer DELETE success',
  })
  async deleteById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.number('id') id: number,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_CDR_SERVER_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.cdrServerRepository.deleteById(id);
  }

  @get('/cdr-servers/for_filters')
  @response(200, {
    description: 'Array of CdrServer model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CdrServer, {includeRelations: true}),
        },
      },
    },
  })
  async for_filter(
  ): Promise<CdrServer[]> {
    return this.cdrServerRepository.find({})
  }
}
