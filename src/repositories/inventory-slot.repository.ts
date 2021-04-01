import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {InventorySlot} from '../models';

export class InventorySlotRepository extends DefaultCrudRepository<
InventorySlot,
  typeof InventorySlot.prototype.id
> {
  constructor(@inject('datasources.mongo') dataSource: MongoDataSource) {
    super(InventorySlot, dataSource);
  }
}