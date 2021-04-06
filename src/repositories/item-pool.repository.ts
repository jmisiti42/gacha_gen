import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {ItemPool} from '../models';

export class ItemPoolRepository extends DefaultCrudRepository<
  ItemPool,
  typeof ItemPool.prototype.id
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(ItemPool, dataSource);
  }
}
