import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {LergDatasource} from '../datasources';
import {LergHistory, LergHistoryRelations} from '../models';

export class LergHistoryRepository extends DefaultCrudRepository<
  LergHistory,
  typeof LergHistory.prototype.id,
  LergHistoryRelations
> {
  constructor(
    @inject('datasources.lerg') dataSource: LergDatasource,
  ) {
    super(LergHistory, dataSource);
  }
}
