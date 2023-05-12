import {Entity, model, property, belongsTo} from '@loopback/repository';
import {Customer} from './customer.model';
import {CdrServer} from './cdr-server.model';

@model({
  name: 'statement'
})
export class Statement extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuidv4'
  })
  id?: string;

  @property({
    type: 'string',
  })
  stmt_no?: string;
  @property({
    type: 'number',
    required: true,
  })
  start_at: number;

  @property({
    type: 'number',
    required: true,
  })
  end_at: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  total_calls: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  total_duration: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  total_cost: number;

  @property({
    type: 'string',
  })
  content?: string;

  @property({
    type: 'string',
  })
  status: string;

  @property({
    type: 'number',
  })
  created_by?: number;

  @property({
    type: 'date',
  })
  created_at?: string;

  @belongsTo(() => Customer, {name: 'customer'})
  customer_id: number;

  @belongsTo(() => CdrServer, {name: 'server'})
  server_id: number;

  constructor(data?: Partial<Statement>) {
    super(data);
  }
}

export interface StatementRelations {
  // describe navigational properties here
}

export type StatementWithRelations = Statement & StatementRelations;
