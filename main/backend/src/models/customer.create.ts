import {property} from '@loopback/repository';

export class CustomerCreateRequest {
  @property({
    type: 'string',
    required: true,
  })
  company_id: string;

  @property({
    type: 'string',
    required: true,
  })
  company_name: string;

  @property({
    type: 'string',
    required: true,
  })
  first_name: string;

  @property({
    type: 'string',
    required: true,
  })
  last_name: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  status: string;

  @property({
    type: 'string',
    required: true,
  })
  rate_type: string;

  @property({
    type: 'number',
  })
  flat_rate?: number;

  @property({
    type: 'number',
  })
  default_rate?: number;

  @property({
    type: 'string',
  })
  init_duration?: number;

  @property({
    type: 'string',
  })
  succ_duration?: number;

  @property({
    type: 'string',
    required: true,
  })
  billing_email: string;

  @property({
    type: 'string',
    required: true,
  })
  billing_method: string;

  @property({
    type: 'number',
  })
  billing_cycle?: number;

  @property({
    type: 'string',
    required: true,
  })
  billing_start: string;


  constructor() {
  }
}
