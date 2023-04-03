import {property} from '@loopback/repository';

export class BulkUpload {
  @property({
    type: 'string',
    required: true,
  })
  method: string;

  @property({
    type: 'string',
    required: true,
  })
  encoded_file: string;

  @property({
    type: 'string',
    required: true,
  })
  extension: string;

  constructor() {
  }
}
