import {Entity, model, property, belongsTo} from '@loopback/repository';
import { Item } from './item.model';
import {User} from './user.model';

@model()
export class Inventory extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  itemId: string;

  // Each item belong to a user, indentified by its id (userId)
  @belongsTo(() => User)
  userId: string;

  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'number',
  })
  amount?: number;

  @property.array(Item, {required: true})
  products: Item[];

  constructor(data?: Partial<Inventory>) {
    super(data);
  }
}
