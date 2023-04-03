import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CustomerResourceGroup, CustomerResourceGroupRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class CustomerResourceGroupRepository extends DefaultCrudRepository<
  CustomerResourceGroup,
  typeof CustomerResourceGroup.prototype.id,
  CustomerResourceGroupRelations
> {

  public readonly created: BelongsToAccessor<User, typeof CustomerResourceGroup.prototype.id>;

  public readonly updated: BelongsToAccessor<User, typeof CustomerResourceGroup.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(CustomerResourceGroup, dataSource);
    this.updated = this.createBelongsToAccessorFor('updated', userRepositoryGetter,);
    this.registerInclusionResolver('updated', this.updated.inclusionResolver);
    this.created = this.createBelongsToAccessorFor('created', userRepositoryGetter,);
    this.registerInclusionResolver('created', this.created.inclusionResolver);
  }
}
