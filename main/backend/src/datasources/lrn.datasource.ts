import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'lrn',
  connector: 'mysql',
  host: process.env.NODE_ENV=='production' ? 'localhost' : 'localhost',
  port: process.env.NODE_ENV=='production' ? 3306 : 3306,
  user: process.env.NODE_ENV=='production' ? 'root' : 'root',
  password: process.env.NODE_ENV=='production' ? 'D1pv@o23!!' : '',
  database: process.env.NODE_ENV=='production' ? 'lrn' : 'lrn',
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class LrnDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'lrn';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.lrn', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
