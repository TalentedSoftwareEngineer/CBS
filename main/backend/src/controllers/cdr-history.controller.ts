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
import {CdrHistory} from '../models';
import {CdrHistoryRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import DataUtils from '../utils/data';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';

@authenticate('jwt')
export class CdrHistoryController {
  constructor(
    @repository(CdrHistoryRepository) public cdrHistoryRepository : CdrHistoryRepository,
  ) {}


  @get('/cdr-histories/count')
  @response(200, {
    description: 'CdrHistory model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('serverId') serverId: string,
    @param.query.string('status') status: string,
    @param.query.string('value') value: string,
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CDR_IMPORT_HISTORY))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = []
    if (status && status!="") {
      custom.push({status: status})
    }
    if (serverId && serverId!="") {
      custom.push({server_id: Number(serverId)})
    }

    return this.cdrHistoryRepository.count(DataUtils.getWhere(value,
      ['name', 'filename', 'status', 'message'],
      '', custom));
  }

  @get('/cdr-histories')
  @response(200, {
    description: 'Array of CdrHistory model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CdrHistory, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.number('limit') limit: number,
    @param.query.number('skip') skip: number,
    @param.query.string('order') order: string,
    @param.query.string('serverId') serverId: string,
    @param.query.string('status') status: string,
    @param.query.string('value') value: string,
  ): Promise<CdrHistory[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CDR_IMPORT_HISTORY))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = []
    if (status && status!="") {
      custom.push({status: status})
    }
    if (serverId && serverId!="") {
      custom.push({server_id: Number(serverId)})
    }

    return this.cdrHistoryRepository.find(DataUtils.getFilter(limit, skip, order, value,
      ['name', 'filename', 'status', 'message'],
      '', custom, undefined));
  }

  @get('/cdr-histories/{id}')
  @response(200, {
    description: 'CdrHistory model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CdrHistory, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<CdrHistory> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CDR_IMPORT_HISTORY))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.cdrHistoryRepository.findById(id);
  }
}
