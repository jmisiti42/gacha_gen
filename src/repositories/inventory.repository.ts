import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Inventory} from '../models';

export class InventoryRepository extends DefaultCrudRepository<
  Inventory,
  typeof Inventory.prototype.itemId
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(Inventory, dataSource);
  }
}
