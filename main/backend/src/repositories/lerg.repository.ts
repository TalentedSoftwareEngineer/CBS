import {inject} from '@loopback/core';
import {DefaultCrudRepository, DefaultTransactionalRepository} from '@loopback/repository';
import {CdrDataSource} from '../datasources';
import {Lerg, LergRelations} from '../models';

export class LergRepository extends DefaultCrudRepository<
  Lerg,
  typeof Lerg.prototype.id,
  LergRelations
> {
  constructor(
    @inject('datasources.cdr') dataSource: CdrDataSource,
  ) {
    super(Lerg, dataSource);
  }
}
