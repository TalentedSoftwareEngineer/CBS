import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {UserInfo, UserInfoRelations} from '../models';

export class UserInfoRepository extends DefaultCrudRepository<
  UserInfo,
  typeof UserInfo.prototype.id,
  UserInfoRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(UserInfo, dataSource);
  }
}
