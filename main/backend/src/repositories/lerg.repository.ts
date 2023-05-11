import {inject} from '@loopback/core';
import {DefaultCrudRepository, DefaultTransactionalRepository} from '@loopback/repository';
import {LergDatasource} from '../datasources';
import {Lerg, LergRelations} from '../models';

export class LergRepository extends DefaultCrudRepository<
  Lerg,
  typeof Lerg.prototype.id,
  LergRelations
> {
  constructor(
    @inject('datasources.lerg') dataSource: LergDatasource,
  ) {
    super(Lerg, dataSource);
  }
}
