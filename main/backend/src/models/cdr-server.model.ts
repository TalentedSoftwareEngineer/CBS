import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model({
  name: 'cdr_server'
})
export class CdrServer extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  address: string;

  @property({
    type: 'number',
    required: true,
  })
  port: number;

  @property({
    type: 'string',
    required: true,
  })
  username: string;

  @property({
    type: 'string',
  })
  password?: string;

  @property({
    type: 'string',
  })
  public_key?: string;

  @property({
    type: 'string',
    required: true,
  })
  path: string;

  @property({
    type: 'date',
    required: true,
  })
  start_date: string;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  is_rate: boolean;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  is_lrn: boolean;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  is_active: boolean;

  @property({
    type: 'string',
  })
  lnp_server?: string;

  @property({
    type: 'string',
  })
  table_name?: string;

  @property({
    type: 'date',
  })
  created_at?: string;
  @property({
    type: 'date',
  })
  updated_at?: string;
  @belongsTo(() => User, {name: 'created'})
  created_by: number;

  @belongsTo(() => User, {name: 'updated'})
  updated_by: number;

  constructor(data?: Partial<CdrServer>) {
    super(data);
  }
}

export interface CdrServerRelations {
  // describe navigational properties here
}

export type CdrServerWithRelations = CdrServer & CdrServerRelations;
