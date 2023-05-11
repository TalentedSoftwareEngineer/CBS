import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CustomerProduct, CustomerProductRelations} from '../models';

export class CustomerProductRepository extends DefaultCrudRepository<
  CustomerProduct,
  typeof CustomerProduct.prototype.id,
  CustomerProductRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(CustomerProduct, dataSource);
  }
}
