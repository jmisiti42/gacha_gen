import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Item} from './item.model';
import {User} from './user.model';

@model()
export class InventorySlot extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  // Each InventorySlot belong to a user, indentified by its id (userId)
  @belongsTo(() => User)
  userId: string;

  @property({
    type: 'number',
  })
  itemId: number;

  @property({
    type: 'number',
    default: 1,
  })
  amount: number;

  @property(Item)
  item: Item;

  constructor(data?: Partial<InventorySlot>) {
    super(data);
  }
}
