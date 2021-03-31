import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Item, ItemRelations} from '../models';

export class ItemRepository extends DefaultCrudRepository<
  Item,
  typeof Item.prototype.itemId,
  ItemRelations
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(Item, dataSource);
  }
}
