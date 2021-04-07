import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
} from '@loopback/rest';
import {Item} from '../models';
import {ItemRepository} from '../repositories';
import {basicAuthorization} from '../services';
import {OPERATION_SECURITY_SPEC, throwError} from '../utils';

@authenticate('jwt')
@authorize({allowedRoles: ['admin', 'user'], voters: [basicAuthorization]})
export class ItemController {
  constructor(
    @repository(ItemRepository)
    public itemRepository: ItemRepository,
  ) {}

  @post('/item', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Item model instance',
        content: {'application/json': {'x-ts-type': getModelSchemaRef(Item)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {
            exclude: ['id', 'itemId'],
          }),
        },
      },
    })
    item: Omit<Item, 'id'>,
  ): Promise<Item> {
    const lastItem = await this.itemRepository.findOne({order: ['id DESC']});
    if (!lastItem) return throwError('error during item creation', 500);
    item.itemId = lastItem.itemId + 1;
    return this.itemRepository.create(item);
  }

  @get('/item/count', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Item model count',
        content: {'application/json': {'x-ts-type': CountSchema}},
      },
    },
  })
  async count(@param.where(Item) where?: Where<Item>): Promise<Count> {
    return this.itemRepository.count(where);
  }

  @get('/items', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Array of Item model instances',
        content: {
          'application/json': {
            'x-ts-type': [getModelSchemaRef(Item, {includeRelations: true})],
          },
        },
      },
    },
  })
  async find(@param.filter(Item) filter?: Filter<Item>): Promise<Item[]> {
    return this.itemRepository.find(filter);
  }

  @patch('/items', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Item PATCH success count',
        content: {'application/json': {'x-ts-type': CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {partial: true}),
        },
      },
    })
    item: Item,
    @param.where(Item) where?: Where<Item>,
  ): Promise<Count> {
    return this.itemRepository.updateAll(item, where);
  }

  @get('/item/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'Item model instance',
        content: {
          'application/json': {
            'x-ts-type': getModelSchemaRef(Item, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Item, {exclude: 'where'}) filter?: FilterExcludingWhere<Item>,
  ): Promise<Item> {
    return this.itemRepository.findById(id, filter);
  }

  @patch('/item/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Item PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Item, {partial: true}),
        },
      },
    })
    item: Item,
  ): Promise<void> {
    await this.itemRepository.updateById(id, item);
  }

  @put('/item/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Item PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() item: Item,
  ): Promise<void> {
    await this.itemRepository.replaceById(id, item);
  }

  @del('/item/{id}', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '204': {
        description: 'Item DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.itemRepository.deleteById(id);
  }
}
