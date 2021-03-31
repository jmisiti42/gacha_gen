import {Entity, model, property} from '@loopback/repository';

@model()
export class Item extends Entity {
  @property({
    type: 'string',
    id: true,
  })
  itemId: string;

  @property({
    type: 'string',
  })
  name: string;

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

  constructor(data?: Partial<Item>) {
    super(data);
  }
}

export interface ItemRelations {
    // describe navigational properties here
  }
  
  export type ItemWithRelations = Item & ItemRelations;