import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DbDataSource} from '../datasources';
import {Statement, StatementRelations, Customer, CdrServer} from '../models';
import {CustomerRepository} from './customer.repository';
import {CdrServerRepository} from './cdr-server.repository';

export class StatementRepository extends DefaultCrudRepository<
  Statement,
  typeof Statement.prototype.id,
  StatementRelations
> {

  public readonly customer: BelongsToAccessor<Customer, typeof Statement.prototype.id>;

  public readonly server: BelongsToAccessor<CdrServer, typeof Statement.prototype.id>;

  constructor(
    @inject('datasources.db') dataSource: DbDataSource, @repository.getter('CustomerRepository') protected customerRepositoryGetter: Getter<CustomerRepository>, @repository.getter('CdrServerRepository') protected cdrServerRepositoryGetter: Getter<CdrServerRepository>,
  ) {
    super(Statement, dataSource);
    this.server = this.createBelongsToAccessorFor('server', cdrServerRepositoryGetter,);
    this.registerInclusionResolver('server', this.server.inclusionResolver);
    this.customer = this.createBelongsToAccessorFor('customer', customerRepositoryGetter,);
    this.registerInclusionResolver('customer', this.customer.inclusionResolver);
  }
}
