import {Entity, model, property, belongsTo} from '@loopback/repository';
import {User} from './user.model';

@model({
  name: 'tfn_number'
})
export class TfnNumber extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuidv4'
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  tfn_num: string;

  @property({
    type: 'number',
  })
  customer_id?: number | null;

  @property({
    type: 'string',
  })
  trans_num?: string;

  @property({
    type: 'string',
  })
  resp_org?: string;

  @property({
    type: 'number',
    default: 0.00,
  })
  price?: number;

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

  constructor(data?: Partial<TfnNumber>) {
    super(data);
  }
}

export interface TfnNumberRelations {
  // describe navigational properties here
}

export type TfnNumberWithRelations = TfnNumber & TfnNumberRelations;
