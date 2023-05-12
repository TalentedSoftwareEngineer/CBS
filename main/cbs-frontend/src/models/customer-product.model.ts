import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'customer_product'
})
export class CustomerProduct extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'boolean',
    required: true,
  })
  account_type: boolean;

  @property({
    type: 'number',
    default: 0,
  })
  local_did_fee?: number;

  @property({
    type: 'number',
    default: 0,
  })
  local_did_setup_fee?: number;

  @property({
    type: 'number',
    default: 0,
  })
  tollfree_fee?: number;

  @property({
    type: 'number',
    default: 0,
  })
  tollfree_setup_fee?: number;

  @property({
    type: 'date',
  })
  created_at?: string;

  @property({
    type: 'date',
  })
  updated_at?: string;


  constructor(data?: Partial<CustomerProduct>) {
    super(data);
  }
}

export interface CustomerProductRelations {
  // describe navigational properties here
}

export type CustomerProductWithRelations = CustomerProduct & CustomerProductRelations;
