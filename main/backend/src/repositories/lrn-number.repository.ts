import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {LrnDataSource} from '../datasources';
import {LrnNumber, LrnNumberRelations} from '../models';

export class LrnNumberRepository extends DefaultCrudRepository<
  LrnNumber,
  typeof LrnNumber.prototype.calling,
  LrnNumberRelations
> {
  constructor(
    @inject('datasources.lrn') dataSource: LrnDataSource,
  ) {
    super(LrnNumber, dataSource);
  }
}
