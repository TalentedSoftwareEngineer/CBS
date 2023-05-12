import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CdrServer, CdrServerRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class CdrServerRepository extends DefaultCrudRepository<
  CdrServer,
  typeof CdrServer.prototype.id,
  CdrServerRelations
> {

  public readonly created: BelongsToAccessor<User, typeof CdrServer.prototype.id>;

  public readonly updated: BelongsToAccessor<User, typeof CdrServer.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(CdrServer, dataSource);
    this.updated = this.createBelongsToAccessorFor('updated', userRepositoryGetter,);
    this.registerInclusionResolver('updated', this.updated.inclusionResolver);
    this.created = this.createBelongsToAccessorFor('created', userRepositoryGetter,);
    this.registerInclusionResolver('created', this.created.inclusionResolver);
  }
}
