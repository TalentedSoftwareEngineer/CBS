import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {LergDataSource} from '../datasources';
import {History, HistoryRelations} from '../models';

export class HistoryRepository extends DefaultCrudRepository<
  History,
  typeof History.prototype.id,
  HistoryRelations
> {
  constructor(
    @inject('datasources.lerg') dataSource: LergDataSource,
  ) {
    super(History, dataSource);
  }
}
