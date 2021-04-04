import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';
import { ItemPool } from './item-pool.model';
import {Item} from './item.model';

@model()
export class Pool extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id: string;

  @property({
    type: 'number',
  })
  minValue: number;

  @property({
    type: 'number',
  })
  maxValue: number;

  @belongsTo(() => ItemPool, {name: 'itemPool'})
  itemPoolId: string;

  @property({
    type: 'number',
  })
  amount: number;

  @belongsTo(() => Item)
  itemId: string;

  constructor(data?: Partial<Pool>) {
    super(data);
  }
}

export interface PoolRelations {
  // describe navigational properties here
}

export type PoolWithRelations = Pool & PoolRelations;