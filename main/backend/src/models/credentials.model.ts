import {Entity, model, property} from '@loopback/repository';

@model({
  name: 'credentials'
})
export class Credentials extends Entity {
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
  username: string;

  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'number',
    required: true,
  })
  user_id: number;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  @property({
    type: 'string',
    required: true,
  })
  salt: string;

  @property({
    type: 'number',
  })
  created_by?: number;

  @property({
    type: 'date',
  })
  created_at?: string;

  @property({
    type: 'number',
  })
  updated_by?: number;

  @property({
    type: 'date',
  })
  updated_at?: string;

  constructor(data?: Partial<Credentials>) {
    super(data);
  }
}

export interface CredentialsRelations {
  // describe navigational properties here
}

export type CredentialsWithRelations = Credentials & CredentialsRelations;
