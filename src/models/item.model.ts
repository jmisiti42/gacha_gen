import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    indexes: {
      uniqueType: {
        keys: {
          itemId: 1,
        },
        options: {
          unique: true,
        },
      },
    },
  },
})
export class Item extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
  })
  itemId: string;

  @property({
    type: 'string',
    required : true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    default: 'common',
  })
  rarity: string;

  // TODO: Implement this in the fixtures
  // Maybe change the way fixtures works to use JS instead of YML to add function
  //   @property({
  //     type: 'function',
  //   })
  //   use: Function;

  @property({
    type: 'string',
  })
  image?: string;

  @property({
    type: 'string',
  })
  description: string;

  @property({
    type: 'string',
  })
  details: string;

  // generateItemId(): string {
  //   const string =  => {
  //     return slot.item.itemId === inventorySlot.id;
  //   });
  //   if (index >= 0) this.inventory.push(inventorySlot);
  //   else this.inventory[index].amount += inventorySlot.amount;
  //   return this;
  // }


  constructor(data?: Partial<Item>) {
    super(data);
  }
}

export interface ItemRelations {
  // describe navigational properties here
}

export type ItemWithRelations = Item & ItemRelations;
