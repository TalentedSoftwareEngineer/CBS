import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'cdr',
  connector: 'mysql',
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: process.env.NODE_ENV=='production' ? 'D1pv@o23!!' : (process.env.NODE_ENV=='development' ? 'D1pv@o23!!' : '') ,
  database: 'cdr',
};


// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class CdrDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'cdr';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.cdr', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
