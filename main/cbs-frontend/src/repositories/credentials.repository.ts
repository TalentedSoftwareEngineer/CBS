import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Credentials, CredentialsRelations} from '../models';

export class CredentialsRepository extends DefaultCrudRepository<
  Credentials,
  typeof Credentials.prototype.id,
  CredentialsRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(Credentials, dataSource);
  }
}
