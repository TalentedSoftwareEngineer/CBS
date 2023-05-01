// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {authenticate} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {CdrService} from '../services';
import {get, HttpErrors, param, response} from '@loopback/rest';
import {Count, CountSchema} from '@loopback/repository';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import DataUtils from '../utils/data';

@authenticate('jwt')
export class CdrLogController {
  constructor(
    @service(CdrService) public cdrService : CdrService,
  ) {}

  @get('/cdr-logs/count')
  @response(200, {
    description: 'CDRLog model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('table') table: string,
    @param.query.string('value') value: string,
    @param.query.number('start_at') start_at: number,
    @param.query.number('end_at') end_at: number,
    @param.query.string('calls_op') calls_op: string,
    @param.query.string('calls') calls: string,
    @param.query.string('duration_op') duration_op: string,
    @param.query.string('duration') duration: string,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CDR_LOG))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (table=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    try {
      const payload = {
        table, value, start_at, end_at, calls_op, calls, duration_op, duration
      }

      const result = await this.cdrService.counts(payload)
      return result
    } catch (err) {
      return {count: 0}
      // throw new HttpErrors.BadRequest(MESSAGES.NO_CDR_LOG)
    }
  }

  @get('/cdr-logs/nap')
  @response(200, {
    description: 'Get list of NAP',
    content: {
      'application/json': {
        schema: {
          type: "object",
        }
      }
    },
  })
  async nap(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('table') table: string,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CDR_LOG))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (table=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    try {
      return await this.cdrService.getNAPs(table)
    } catch (err) {
      return []
    }
  }

  @get('/cdr-logs')
  @response(200, {
    description: 'CDRLog model',
    content: {
      'application/json': {
        schema: {
          type: "object",
        }
      }
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
    @param.query.string('table') table: string,
    @param.query.number('limit') limit: number,
    @param.query.number('skip') skip: number,
    @param.query.string('order') order: string,
    @param.query.string('value') value: string,
    @param.query.number('start_at') start_at: number,
    @param.query.number('end_at') end_at: number,
    @param.query.string('calls_op') calls_op: string,
    @param.query.string('calls') calls: string,
    @param.query.string('duration_op') duration_op: string,
    @param.query.string('duration') duration: string,
    @param.query.string('nap') nap: string,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CDR_LOG))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (table=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    try {
      const payload = {
        table, limit, skip, order, value, start_at, end_at, calls_op, calls, duration_op, duration, nap
      }

      const result = await this.cdrService.finds(payload)
      return result
    } catch (err) {
      console.log(err)
      throw new HttpErrors.BadRequest(MESSAGES.NO_CDR_LOG)
    }
  }
}
