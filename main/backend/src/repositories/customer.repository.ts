import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  repository,
  BelongsToAccessor,
  HasOneRepositoryFactory,
  DefaultTransactionalRepository, HasManyRepositoryFactory} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Customer, CustomerRelations, User, CustomerInfo, CustomerBilling, CustomerResourceGroup, CustomerRate} from '../models';
import {UserRepository} from './user.repository';
import {CustomerInfoRepository} from './customer-info.repository';
import {CustomerBillingRepository} from './customer-billing.repository';
import {CustomerResourceGroupRepository} from './customer-resource-group.repository';
import {authenticate} from '@loopback/authentication';
import {CustomerRateRepository} from './customer-rate.repository';

@authenticate('jwt')
export class CustomerRepository extends DefaultTransactionalRepository<
  Customer,
  typeof Customer.prototype.id,
  CustomerRelations
> {

  public readonly created: BelongsToAccessor<User, typeof Customer.prototype.id>;

  public readonly updated: BelongsToAccessor<User, typeof Customer.prototype.id>;

  public readonly customerInfo: HasOneRepositoryFactory<CustomerInfo, typeof Customer.prototype.id>;

  public readonly customerBilling: HasOneRepositoryFactory<CustomerBilling, typeof Customer.prototype.id>;

  public readonly customerResourceGroups: HasManyRepositoryFactory<CustomerResourceGroup, typeof Customer.prototype.id>;

  public readonly customerRates: HasManyRepositoryFactory<CustomerRate, typeof Customer.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('CustomerInfoRepository') protected customerInfoRepositoryGetter: Getter<CustomerInfoRepository>, @repository.getter('CustomerBillingRepository') protected customerBillingRepositoryGetter: Getter<CustomerBillingRepository>, @repository.getter('CustomerResourceGroupRepository') protected customerResourceGroupRepositoryGetter: Getter<CustomerResourceGroupRepository>, @repository.getter('CustomerRateRepository') protected customerRateRepositoryGetter: Getter<CustomerRateRepository>,
  ) {
    super(Customer, dataSource);
    this.customerRates = this.createHasManyRepositoryFactoryFor('customerRates', customerRateRepositoryGetter,);
    this.registerInclusionResolver('customerRates', this.customerRates.inclusionResolver);
    this.customerResourceGroups = this.createHasManyRepositoryFactoryFor('customerResourceGroups', customerResourceGroupRepositoryGetter,);
    this.registerInclusionResolver('customerResourceGroups', this.customerResourceGroups.inclusionResolver);
    this.customerBilling = this.createHasOneRepositoryFactoryFor('customerBilling', customerBillingRepositoryGetter);
    this.registerInclusionResolver('customerBilling', this.customerBilling.inclusionResolver);
    this.customerInfo = this.createHasOneRepositoryFactoryFor('customerInfo', customerInfoRepositoryGetter);
    this.registerInclusionResolver('customerInfo', this.customerInfo.inclusionResolver);
    this.updated = this.createBelongsToAccessorFor('updated', userRepositoryGetter,);
    this.registerInclusionResolver('updated', this.updated.inclusionResolver);
    this.created = this.createBelongsToAccessorFor('created', userRepositoryGetter,);
    this.registerInclusionResolver('created', this.created.inclusionResolver);
  }

}
