import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model({
  name: 'vendor_rate'
})
export class VendorRate extends Entity {
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
  npanxx: string;

  @property({
    type: 'string',
  })
  lata?: string;

  @property({
    type: 'string',
  })
  ocn?: string;

  @property({
    type: 'string',
  })
  ocn_name?: string;

  @property({
    type: 'string',
  })
  state?: string;

  @property({
    type: 'string',
  })
  category?: string;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  inter_rate: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  intra_rate: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  init_duration: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
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

  constructor(data?: Partial<VendorRate>) {
    super(data);
  }
}

export interface VendorRateRelations {
  // describe navigational properties here
}

export type VendorRateWithRelations = VendorRate & VendorRateRelations;
