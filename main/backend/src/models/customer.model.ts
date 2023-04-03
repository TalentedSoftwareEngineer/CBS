import {Entity, model, property, belongsTo, hasOne, hasMany} from '@loopback/repository';
import {User} from './user.model';
import {CustomerInfo} from './customer-info.model';
import {CustomerBilling} from './customer-billing.model';
import {CustomerResourceGroup} from './customer-resource-group.model';
import {CustomerRate} from './customer-rate.model';

@model({
  name: 'customer'
})
export class Customer extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'string',
    required: true,
  })
  company_id: string;

  @property({
    type: 'string',
    required: true,
  })
  company_name: string;

  @property({
    type: 'string',
    required: true,
  })
  first_name: string;

  @property({
    type: 'string',
    required: true,
  })
  last_name: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  status: string;

  @property({
    type: 'boolean',
    required: true,
    default: false,
  })
  allowed: boolean;

  @property({
    type: 'string',
  })
  settings?: string;

  @property({
    type: 'string',
    required: true,
  })
  rate_type: string;

  @property({
    type: 'number',
  })
  flat_rate?: number;

  @property({
    type: 'number',
  })
  default_rate?: number;

  @property({
    type: 'number',
  })
  init_duration?: number;

  @property({
    type: 'number',
  })
  succ_duration?: number;

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

  @hasOne(() => CustomerInfo, {keyTo: 'id'})
  customerInfo: CustomerInfo;

  @hasOne(() => CustomerBilling, {keyTo: 'id'})
  customerBilling: CustomerBilling;

  @hasMany(() => CustomerResourceGroup, {keyTo: 'customer_id'})
  customerResourceGroups: CustomerResourceGroup[];

  @hasMany(() => CustomerRate, {keyTo: 'customer_id'})
  customerRates: CustomerRate[];

  constructor(data?: Partial<Customer>) {
    super(data);
  }
}

export interface CustomerRelations {
  // describe navigational properties here
}

export type CustomerWithRelations = Customer & CustomerRelations;
