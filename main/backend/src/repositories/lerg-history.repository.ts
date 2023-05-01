import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {CdrDataSource} from '../datasources';
import {LergHistory, LergHistoryRelations} from '../models';

export class LergHistoryRepository extends DefaultCrudRepository<
  LergHistory,
  typeof LergHistory.prototype.id,
  LergHistoryRelations
> {
  constructor(
    @inject('datasources.cdr') dataSource: CdrDataSource,
  ) {
    super(LergHistory, dataSource);
  }
}
