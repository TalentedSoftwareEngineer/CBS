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
import {LrnNumber, TfnNumber} from '../models';
import {LrnNumberRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';

@authenticate('jwt')
export class LrnNumberController {
  constructor(
    @repository(LrnNumberRepository)
    public lrnNumberRepository : LrnNumberRepository,
  ) {}

  @get('/lrn-numbers/count')
  @response(200, {
    description: 'LrnNumber model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('value') value: string,
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_LRN_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.lrnNumberRepository.count(DataUtils.getWhere(value,
      ['calling', 'translated', 'lata', 'thousand'],
      'calling,translated', undefined));
  }

  @get('/lrn-numbers')
  @response(200, {
    description: 'Array of LrnNumber model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(LrnNumber, {includeRelations: true}),
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
  ): Promise<LrnNumber[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_LRN_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.lrnNumberRepository.find(DataUtils.getFilter(limit, skip, order, value,
      ['calling', 'translated', 'lata', 'thousand'],
      'calling,translated', undefined, undefined));
  }

  @get('/lrn-numbers/{id}')
  @response(200, {
    description: 'LrnNumber model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(LrnNumber, {includeRelations: true}),
      },
    },
  })
  async findById(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.path.string('id') id: string,
  ): Promise<LrnNumber> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.READ_LRN_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.lrnNumberRepository.findById(id, {});
  }
}
