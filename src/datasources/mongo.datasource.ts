import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const mongodbUrl = process.env.MONGO_URI;

let config = {};

if (mongodbUrl) {
  console.log('Using MongoDB with: ' + mongodbUrl);
  config = {
    url: mongodbUrl,
    name: 'mongo',
    connector: 'mongodb',
    useNewUrlParser: true,
  };
} else {
  console.log('No env var found for MONGO_URI, so using local config');
  config = {
    name: 'mongo',
    connector: 'mongodb',
    url: '',
    host: 'localhost',
    port: 27017,
    user: '',
    password: '',
    database: 'gacha_gen',
    useNewUrlParser: true,
    writeConcern: {j: null},
  };
}

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class MongoDataSource
  extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'mongo';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.mongo', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
