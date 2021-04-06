import {Entity, hasMany, hasOne, model, property} from '@loopback/repository';
import {InventorySlot} from './inventory-slot.model';
import {UserCredentials} from './user-credentials.model';

@model({
  settings: {
    indexes: {
      uniqueEmail: {
        keys: {
          email: 1,
        },
        options: {
          unique: true,
        },
      },
    },
  },
})
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
  })
  username: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @hasMany(() => InventorySlot)
  inventory: InventorySlot[];

  @hasOne(() => UserCredentials)
  userCredentials: UserCredentials;

  @property({
    type: 'string',
  })
  resetKey?: string;

  @property({
    type: 'number',
  })
  resetCount: number;

  @property({
    type: 'array',
    itemType: 'string',
  })
  roles?: string[];

  @property({
    type: 'string',
  })
  resetTimestamp: string;

  @property({
    type: 'string',
  })
  resetKeyTimestamp: string;

  addItem(inventorySlot: InventorySlot): User {
    const index = this.inventory.findIndex((slot: InventorySlot) => {
      return slot.item.itemId === inventorySlot.id;
    });
    if (index >= 0) this.inventory.push(inventorySlot);
    else this.inventory[index].amount += inventorySlot.amount;
    return this;
  }

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
