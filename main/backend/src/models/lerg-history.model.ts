import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'lerg_history'
})
export class LergHistory extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
    defaultFn: 'uuidv4'
  })
  id: string;

  @property({
    type: 'string',
  })
  filename?: string;

  @property({
    type: 'string',
  })
  message?: string;

  @property({
    type: 'string',
    required: true,
  })
  status: string;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  total: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  completed: number;

  @property({
    type: 'number',
    required: true,
    default: 0,
  })
  failed: number;

  @property({
    type: 'date',
  })
  created_at?: string;

  @property({
    type: 'date',
  })
  updated_at?: string;

  constructor(data?: Partial<LergHistory>) {
    super(data);
  }
}

export interface LergHistoryRelations {
  // describe navigational properties here
}

export type LergHistoryWithRelations = LergHistory & LergHistoryRelations;
