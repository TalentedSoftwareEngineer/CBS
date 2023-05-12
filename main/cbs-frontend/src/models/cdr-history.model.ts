import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'cdr_history'
})
export class CdrHistory extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    defaultFn: 'uuidv4'
  })
  id?: string;

  @property({
    type: 'number',
    required: true,
  })
  server_id: number;

  @property({
    type: 'string',
    required: true,
  })
  filename: string;

  @property({
    type: 'string',
    required: true,
  })
  status: string;

  @property({
    type: 'string',
  })
  message?: string;

  @property({
    type: 'date',
  })
  created_at?: string;

  @property({
    type: 'date',
  })
  updated_at?: string;


  constructor(data?: Partial<CdrHistory>) {
    super(data);
  }
}

export interface CdrHistoryRelations {
  // describe navigational properties here
}

export type CdrHistoryWithRelations = CdrHistory & CdrHistoryRelations;
