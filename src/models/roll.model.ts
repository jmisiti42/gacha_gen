import {Entity, model, property} from '@loopback/repository';

@model()
export class Roll extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'string',
    required: true,
  })
  userId: string;


  constructor(data?: Partial<Roll>) {
    super(data);
  }
}

export interface RollRelations {
  // describe navigational properties here
}

export type RollWithRelations = Roll & RollRelations;
