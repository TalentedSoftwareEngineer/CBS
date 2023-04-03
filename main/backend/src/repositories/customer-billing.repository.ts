import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CustomerBilling, CustomerBillingRelations} from '../models';

export class CustomerBillingRepository extends DefaultCrudRepository<
  CustomerBilling,
  typeof CustomerBilling.prototype.id,
  CustomerBillingRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CustomerBilling, dataSource);
  }
}
