import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  HasOneRepositoryFactory,
  DefaultTransactionalRepository
} from '@loopback/repository';
import {DbDataSource} from '../datasources';
// @ts-ignore
import {User, UserRelations, UserInfo, Role, Customer} from '../models';
import {UserInfoRepository} from './user-info.repository';
import {RoleRepository} from './role.repository';
import {CustomerRepository} from './customer.repository';

export class UserRepository extends DefaultTransactionalRepository<
  User,
  typeof User.prototype.id,
  UserRelations
  > {

  public readonly userInfo: HasOneRepositoryFactory<UserInfo, typeof User.prototype.id>;

  public readonly role: BelongsToAccessor<Role, typeof User.prototype.id>;

  public readonly customer: BelongsToAccessor<Customer, typeof User.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserInfoRepository') protected userInfoRepositoryGetter: Getter<UserInfoRepository>, @repository.getter('RoleRepository') protected roleRepositoryGetter: Getter<RoleRepository>, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>,
  ) {
    super(User, dataSource);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
    this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter,);
    this.registerInclusionResolver('role', this.role.inclusionResolver);
    this.userInfo = this.createHasOneRepositoryFactoryFor('userInfo', userInfoRepositoryGetter);
    this.registerInclusionResolver('userInfo', this.userInfo.inclusionResolver);
  }

  async getInfo(
    userId: typeof User.prototype.id,
  ): Promise<UserInfo | undefined> {
    return this.userInfo(userId)
      .get()
      .catch(err => {
        if (err.code === 'ENTITY_NOT_FOUND') return undefined;
        throw err;
      });
  }

  async getCustomer(
    userId: typeof User.prototype.id,
  ): Promise<Customer | undefined> {
    return this.customer(userId)
      .catch(err => {
        if (err.code === 'ENTITY_NOT_FOUND') return undefined;
        throw err;
      });
  }


}
