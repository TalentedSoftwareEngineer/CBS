import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {RolePrivilege, RolePrivilegeRelations} from '../models';

export class RolePrivilegeRepository extends DefaultCrudRepository<
  RolePrivilege,
  typeof RolePrivilege.prototype.id,
  RolePrivilegeRelations
> {
  constructor(
    @inject('datasources.db') dataSource: DbDataSource,
  ) {
    super(RolePrivilege, dataSource);
  }
}
