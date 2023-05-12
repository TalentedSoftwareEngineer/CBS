import {Entity, model, property, belongsTo} from '@loopback/repository';

@model({
  name: 'customer_info'
})
export class CustomerInfo extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  address?: string;

  @property({
    type: 'string',
  })
  city?: string;

  @property({
    type: 'string',
  })
  state?: string;

  @property({
    type: 'string',
  })
  country?: string;

  @property({
    type: 'string',
  })
  zip?: string;

  @property({
    type: 'string',
  })
  phone?: string;

  @property({
    type: 'string',
  })
  ssn?: string;
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

  constructor(data?: Partial<CustomerInfo>) {
    super(data);
  }
}

export interface CustomerInfoRelations {
  // describe navigational properties here
}

export type CustomerInfoWithRelations = CustomerInfo & CustomerInfoRelations;
