import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model({
  name: 'customer_rate'
})
export class CustomerRate extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuidv4'
  })
  id?: string;

  @property({
    type: 'number',
  })
  customer_id?: number;

  @property({
    type: 'string',
    required: true,
  })
  prefix: string;

  @property({
    type: 'string',
    required: true,
  })
  destination: string;

  @property({
    type: 'number',
    required: true,
  })
  inter_rate: number;

  @property({
    type: 'number',
    required: true,
  })
  intra_rate: number;

  @property({
    type: 'number',
    required: true,
  })
  init_duration: number;

  @property({
    type: 'number',
    required: true,
  })
  succ_duration: number;

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

  constructor(data?: Partial<CustomerRate>) {
    super(data);
  }
}

export interface CustomerRateRelations {
  // describe navigational properties here
}

export type CustomerRateWithRelations = CustomerRate & CustomerRateRelations;
