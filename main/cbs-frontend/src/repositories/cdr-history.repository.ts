import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {CdrDataSource} from '../datasources';
import {CdrHistory, CdrHistoryRelations} from '../models';

export class CdrHistoryRepository extends DefaultCrudRepository<
  CdrHistory,
  typeof CdrHistory.prototype.id,
  CdrHistoryRelations
> {
  constructor(
    @inject('datasources.cdr') dataSource: CdrDataSource,
  ) {
    super(CdrHistory, dataSource);
  }
}
