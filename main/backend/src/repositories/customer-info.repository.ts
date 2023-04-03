import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CustomerInfo, CustomerInfoRelations} from '../models';

export class CustomerInfoRepository extends DefaultCrudRepository<
  CustomerInfo,
  typeof CustomerInfo.prototype.id,
  CustomerInfoRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CustomerInfo, dataSource);
  }
}
