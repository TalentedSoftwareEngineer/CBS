import {Entity, model, property, belongsTo} from '@loopback/repository';

@model({
  name: 'main'
})
export class Lerg extends Entity {
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
  npanxx: string;

  @property({
    type: 'string',
  })
  lata?: string;

  @property({
    type: 'string',
  })
  lata_name?: string;

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
  rate_center?: string;

  @property({
    type: 'string',
  })
  country?: string;

  @property({
    type: 'string',
  })
  state?: string;

  @property({
    type: 'string',
  })
  abbre?: string;

  @property({
    type: 'string',
  })
  company?: string;

  @property({
    type: 'string',
  })
  category?: string;

  @property({
    type: 'string',
  })
  thousand?: string;

  @property({
    type: 'string',
  })
  clli?: string;

  @property({
    type: 'string',
  })
  ilec?: string;

  @property({
    type: 'string',
  })
  switch_name?: string;

  @property({
    type: 'string',
  })
  switch_type?: string;

  @property({
    type: 'string',
  })
  assign_date?: string;

  @property({
    type: 'string',
  })
  prefix_type?: string;

  @property({
    type: 'number',
    default: 0.0
  })
  rate?: number;

  @property({
    type: 'string',
  })
  note?: string;

  @property({
    type: 'date',
  })
  created_at?: string

  @property({
    type: 'date',
  })
  updated_at?: string;


  constructor(data?: Partial<Lerg>) {
    super(data);
  }
}

export interface LergRelations {
  // describe navigational properties here
}

export type LergWithRelations = Lerg & LergRelations;
