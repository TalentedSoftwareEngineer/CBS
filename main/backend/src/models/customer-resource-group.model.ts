import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model({
  name: 'customer_rg'
})
export class CustomerResourceGroup extends Entity {
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
  rgid: string;

  @property({
    type: 'number',
  })
  partition_id?: number;

  @property({
    type: 'string',
  })
  ip?: string;

  @property({
    type: 'string',
    required: true,
  })
  direction: string;

  @property({
    type: 'boolean',
    required: true,
  })
  active: boolean;

  @property({
    type: 'string',
  })
  description?: string;

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

  constructor(data?: Partial<CustomerResourceGroup>) {
    super(data);
  }
}

export interface CustomerResourceGroupRelations {
  // describe navigational properties here
}

export type CustomerResourceGroupWithRelations = CustomerResourceGroup & CustomerResourceGroupRelations;
