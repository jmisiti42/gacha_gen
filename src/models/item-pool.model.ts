import {Entity, hasMany, model, property} from '@loopback/repository';
import { InventorySlot } from './inventory-slot.model';
import { Pool } from './pool.model';

@model({
  settings: {
    indexes: {
      uniqueType: {
        keys: {
          type: 1,
        },
        options: {
          unique: true,
        },
      },
    },
  },
})
export class ItemPool extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
    description: 'ItemPools identified by types, be carefull it is a unique identifier',
    required: true,
  })
  type: string;

  @property({
    type: 'string',
  })
  title: string;

  @property({
    type: 'string',
  })
  description: string;

  @property({
    type: 'string',
  })
  image: string;

  @property({
    type: 'array',
    itemType: 'object',
    default: []
  })
  pool: Pool[];

  /*
  ** Roll to drop an item, if nothing is found we give 
  ** the first item of the pool.
  ** This case should not happen but in case.
  */
  rollItem(userId: string): InventorySlot {
    const rollValue = Math.round(Math.random() * 100);
    const itemFound = this.pool.find(el => 
      el.maxValue <= rollValue &&
      el.minValue >= rollValue
    ) ?? this.pool[0];

    return new InventorySlot({
      ...itemFound,
      userId,
      itemId: itemFound.itemId,
    })
  }

  constructor(data?: Partial<ItemPool>) {
    super(data);
  }
}

export interface ItemPoolRelations {
  // describe navigational properties here
}

export type ItemPoolWithRelations = ItemPool & ItemPoolRelations;