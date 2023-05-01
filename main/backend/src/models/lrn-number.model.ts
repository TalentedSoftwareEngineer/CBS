import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'lrn_number'
})
export class LrnNumber extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  calling: string;

  @property({
    type: 'string',
    required: true,
  })
  translated: string;

  @property({
    type: 'string',
  })
  lata?: string;

  @property({
    type: 'string',
  })
  thousand?: string;

  constructor(data?: Partial<LrnNumber>) {
    super(data);
  }
}

export interface LrnNumberRelations {
  // describe navigational properties here
}

export type LrnNumberWithRelations = LrnNumber & LrnNumberRelations;
