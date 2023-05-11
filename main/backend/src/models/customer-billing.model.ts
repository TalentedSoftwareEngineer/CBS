import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'customer_billing'
})
export class CustomerBilling extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  method: string;

  @property({
    type: 'number',
  })
  cycle?: number;

  @property({
    type: 'string',
    required: true,
  })
  start: string;

  @property({
    type: 'date',
  })
  created_at?: string;

  @property({
    type: 'date',
  })
  updated_at?: string;

  @property({
    type: 'number',
  })
  created_by: number;

  @property({
    type: 'number',
  })
  updated_by: number;

  constructor(data?: Partial<CustomerBilling>) {
    super(data);
  }
}

export interface CustomerBillingRelations {
  // describe navigational properties here
}

export type CustomerBillingWithRelations = CustomerBilling & CustomerBillingRelations;
