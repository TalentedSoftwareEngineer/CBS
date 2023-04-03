import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {VendorRate, VendorRateRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class VendorRateRepository extends DefaultCrudRepository<
  VendorRate,
  typeof VendorRate.prototype.id,
  VendorRateRelations
> {

  public readonly created: BelongsToAccessor<User, typeof VendorRate.prototype.id>;

  public readonly updated: BelongsToAccessor<User, typeof VendorRate.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(VendorRate, dataSource);
    this.updated = this.createBelongsToAccessorFor('updated', userRepositoryGetter,);
    this.registerInclusionResolver('updated', this.updated.inclusionResolver);
    this.created = this.createBelongsToAccessorFor('created', userRepositoryGetter,);
    this.registerInclusionResolver('created', this.created.inclusionResolver);
  }
}
