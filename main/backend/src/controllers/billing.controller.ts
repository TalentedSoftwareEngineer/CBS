// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {authenticate} from "@loopback/authentication";
import {inject, service} from "@loopback/core";
import {del, get, getModelSchemaRef, HttpErrors, param, patch, post, requestBody, response} from "@loopback/rest";
import {SecurityBindings, securityId, UserProfile} from "@loopback/security";
import {PERMISSIONS} from "../constants/permissions";
import {MESSAGES} from "../constants/messages";
import {BillingService, RoleService} from "../services";
import {CdrServer, Customer, Statement} from "../models";
import {BILLING_STATUS, NO_TYPE, USER_TYPE} from "../constants/configurations";
import DataUtils from "../utils/data";
import {Count, CountSchema, repository} from "@loopback/repository";
import {StatementRepository} from "../repositories";

@authenticate('jwt')
export class BillingController {
  constructor(
      @repository(StatementRepository) public statementRepository : StatementRepository,
      @service(BillingService) public billingService : BillingService,
  ) {}

  @post('/statement/auto', {
    description: 'Update Auto Statement',
    responses: {
      '200': {
        description: 'NSRRequest ID',
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {
                req_id: {
                  type: "string"
                }
              }
            }
          }
        },
      }
    }
  })
  async update_auto_statement(
      @requestBody({
        content: {
          'application/json': {
            schema: {
              type: "array",
              items: {
                type: 'object',
                properties: {
                  customer_id: {
                    type: "number",
                  },
                  auto_statement: {
                    type: "boolean",
                  },
                }
              }
            },
          },
        },
      })
          req: any,
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.AUTO_GENERATE_STATEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    return this.billingService.updateAutoStatement(req)
  }

  @get('/billing/rate_deck')
  @response(200, {
    description: 'Array of Rate Deck',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {

            }
          },
        },
      },
    },
  })
  async rate_deck(
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
      @param.query.number('customer_id') customer_id: number,
      @param.query.string('server_id') server_id: string,
      @param.query.number('start_at') start_at: number,
      @param.query.number('end_at') end_at: number,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CREATE_BILLING_STATEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (customer_id==null || start_at==null || end_at==null)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS);

    return this.billingService.calculateRateDeck(customer_id, server_id, start_at, end_at)
  }

  @post('/statement/check', {
    description: 'Check statement and get Statement No',
    responses: {
      '200': {
        description: 'Statement',
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
  async checkStatement(
      @requestBody({
        content: {
          'application/json': {
            schema: {
              type: "array",
              items: {
                type: 'object',
                properties: {
                  customer_id: {
                    type: "number",
                  },
                  server_id: {
                    type: "string",
                  },
                  start_at: {
                    type: "number",
                  },
                  end_at: {
                    type: "number",
                  },
                }
              }
            },
          },
        },
      })
        req: any,
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CREATE_BILLING_STATEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (req.customer_id==null || req.start_at==null || req.end_at==null)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    const res: any = { existed: false, stmt_no: '' }
    const { customer_id, server_id, start_at, end_at } = req
    let conditions: any[] = [ {customer_id}, {start_at}, {end_at} ]
    if (server_id!=null && server_id!="")
      conditions.push({server_id})

    // check existing statement
    const stmt = await this.statementRepository.findOne({where: {and: conditions}})
    if (stmt) {
      res.existed = true
      res.stmt = stmt
    }

    // get max statement no
    let no = (start_at+"").substring(0, 8)// + DataUtils.pad(Math.floor(Math.random()*999999)+"", 6)
    const st = await this.statementRepository.execute(" select max(`no`) as `no` from `no_pending` where `type`='" + NO_TYPE.STATEMENT + "' and substr(`no`, 0, 8)='" + no + "' ")

    no = no + "0001"
    if (st && st.length>0) {
      if (st[0].no!=null)
        no = (Number(st[0].no) + 1) + ""
    }

    // add no to pending table, so that anyone cannot use this no anymore.
    await this.statementRepository.execute(" insert into `no_pending`(`type`, `no`) values('" + NO_TYPE.STATEMENT + "', '" + no + "') ")
    res.stmt_no = no

    return res
  }

  @post('/statement/generate', {
    description: 'Generate Statement',
    responses: {
      '200': {
        description: 'Statement',
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
  async generateStatement(
      @requestBody({
        content: {
          'application/json': {
            schema: {
              type: "array",
              items: {
                type: 'object',
                properties: {
                  stmt_no: {
                    type: "string"
                  },
                  customer_id: {
                    type: "number",
                  },
                  server_id: {
                    type: "string",
                  },
                  start_at: {
                    type: "number",
                  },
                  end_at: {
                    type: "number",
                  },
                  total_calls: {
                    type: "number",
                  },
                  total_duration: {
                    type: "number",
                  },
                  total_cost: {
                    type: "number",
                  },
                  content: {
                    type: "string"
                  }
                }
              }
            },
          },
        },
      })
          req: any,
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.CREATE_BILLING_STATEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    if (req.customer_id==null || req.start_at==null || req.end_at==null)
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    if (req.stmt_no==null || req.stmt_no=="")
      throw new HttpErrors.BadRequest(MESSAGES.MISSING_PARAMETERS)

    try {
      const stmt = new Statement()
      stmt.stmt_no = req.stmt_no
      stmt.customer_id = req.customer_id
      if (req.server_id!=null && req.server_id!="")
        stmt.server_id = req.server_id
      stmt.start_at = req.start_at
      stmt.end_at = req.end_at
      stmt.total_calls = req.total_calls
      stmt.total_duration = req.total_duration
      stmt.total_cost = req.total_cost
      stmt.content = req.content
      stmt.status = BILLING_STATUS.NEW
      stmt.created_at = new Date().toISOString()
      stmt.created_by = profile.user.id

      await this.statementRepository.create(stmt)
    } catch (err) {
      console.log("eror in creating statement", err)
      throw new HttpErrors.BadRequest("Error in Creating a new statement. " + err?.message)
    }

    return { success: true }
  }

  @get('/statement/count')
  @response(200, {
    description: 'Statement model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async countStatement(
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
      @param.query.string('value') value: string,
      @param.query.string('customer_id') customer_id: string,
      @param.query.string('server_id') server_id: string,
      @param.query.string('start_at') start_at: string,
      @param.query.string('end_at') end_at: string,
      @param.query.string('status') status: string,
  ): Promise<Count> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.VIEW_BILLING_STATEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let custom: any[] = []
    if (customer_id!="")
      custom.push({customer_id: Number(customer_id)})
    if (server_id!="")
      custom.push({server_id: Number(server_id)})
    if (start_at!="")
      custom.push({start_at: { gt: Number(start_at)}})
    if (end_at!="")
      custom.push({end_at: { lt: Number(end_at)}})
    if (status!="")
      custom.push({status: status})

    return this.statementRepository.count(DataUtils.getWhere(value,
        ['stmt_no', 'status'],
        '', custom));
  }

  @get('/statement/find')
  @response(200, {
    description: 'Array of Statement model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Statement, {includeRelations: true}),
        },
      },
    },
  })
  async findStatement(
      @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
      @param.query.number('limit') limit: number,
      @param.query.number('skip') skip: number,
      @param.query.string('order') order: string,
      @param.query.string('value') value: string,
      @param.query.string('customer_id') customer_id: string,
      @param.query.string('server_id') server_id: string,
      @param.query.string('start_at') start_at: string,
      @param.query.string('end_at') end_at: string,
      @param.query.string('status') status: string,
  ): Promise<Statement[]> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.VIEW_BILLING_STATEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    let include = []
    include.push({relation: 'customer'})
    include.push({relation: 'server'})

    let custom: any[] = []
    if (customer_id!="")
      custom.push({customer_id: Number(customer_id)})
    if (server_id!="")
      custom.push({server_id: Number(server_id)})
    if (start_at!="")
      custom.push({start_at: { gt: Number(start_at)}})
    if (end_at!="")
      custom.push({end_at: { lt: Number(end_at)}})
    if (status!="")
    custom.push({status: status})

    return this.statementRepository.find(DataUtils.getFilter(limit, skip, order, value,
        ['stmt_no', 'status'],
        '', custom, include));
  }

}
