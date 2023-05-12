import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {CustomerRate, CustomerRateRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class CustomerRateRepository extends DefaultCrudRepository<
  CustomerRate,
  typeof CustomerRate.prototype.id,
  CustomerRateRelations
> {

  public readonly created: BelongsToAccessor<User, typeof CustomerRate.prototype.id>;

  public readonly updated: BelongsToAccessor<User, typeof CustomerRate.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(CustomerRate, dataSource);
    this.updated = this.createBelongsToAccessorFor('updated', userRepositoryGetter,);
    this.registerInclusionResolver('updated', this.updated.inclusionResolver);
    this.created = this.createBelongsToAccessorFor('created', userRepositoryGetter,);
    this.registerInclusionResolver('created', this.created.inclusionResolver);
  }
}
