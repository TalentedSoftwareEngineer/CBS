import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {TfnNumber, TfnNumberRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class TfnNumberRepository extends DefaultCrudRepository<
  TfnNumber,
  typeof TfnNumber.prototype.id,
  TfnNumberRelations
> {

  public readonly created: BelongsToAccessor<User, typeof TfnNumber.prototype.id>;

  public readonly updated: BelongsToAccessor<User, typeof TfnNumber.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(TfnNumber, dataSource);
    this.updated = this.createBelongsToAccessorFor('updated', userRepositoryGetter,);
    this.registerInclusionResolver('updated', this.updated.inclusionResolver);
    this.created = this.createBelongsToAccessorFor('created', userRepositoryGetter,);
    this.registerInclusionResolver('created', this.created.inclusionResolver);
  }
}
