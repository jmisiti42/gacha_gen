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
  response,
} from '@loopback/rest';
import {ItemPool} from '../models';
import {Pool} from '../models/pool.model';
import {ItemPoolRepository, ItemRepository} from '../repositories';
import {basicAuthorization} from '../services';
import {OPERATION_SECURITY_SPEC, throwError} from '../utils';

export class ItemPoolController {
  constructor(
    @repository(ItemPoolRepository)
    public itemPoolRepository: ItemPoolRepository,
    @repository(ItemRepository)
    public itemRepository: ItemRepository,
  ) {}

  @post('/pool')
  @authenticate('jwt')
  @authorize({allowedRoles: ['admin'], voters: [basicAuthorization]})
  @response(200, {
    security: OPERATION_SECURITY_SPEC,
    description: 'ItemPool model instance',
    content: {'application/json': {schema: getModelSchemaRef(ItemPool)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ItemPool, {
            title: 'NewItemPool',
          }),
        },
      },
    })
    itemPool: ItemPool,
  ): Promise<ItemPool> {
    return this.itemPoolRepository.create(itemPool);
  }

  @post('/pool/{id}/item/{itemId}')
  @response(200, {
    description: 'ItemPool model instance',
    content: {
      'application/json': {schema: {'x-ts-type': getModelSchemaRef(ItemPool)}},
    },
  })
  async addItem(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Pool, {partial: true}),
        },
      },
    })
    pool: Pool,
    @param.path.string('id') id: string,
    @param.path.string('itemId') itemId: string,
  ): Promise<ItemPool | Error> {
    if (
      pool.maxValue < pool.minValue ||
      pool.minValue < 0 ||
      pool.maxValue > 100
    ) {
      return throwError(
        'pool values are wrongs. Be sure values are between (Min: 0 and Max: 100)',
        400,
      );
    }
    const itemPool = await this.itemPoolRepository.findById(id);
    const item = await this.itemRepository.findOne({where: {itemId}});
    if (!item || !itemPool) {
      return throwError((!item ? 'Item' : 'ItemPool') + ' not found.', 404);
    }
    if (
      itemPool.pool.find(
        el => el.maxValue <= pool.maxValue && el.minValue >= pool.minValue,
      )
    ) {
      return throwError(
        `Already an item reachable with values: ${pool.minValue} -> ${pool.maxValue} `,
        400,
      );
    }
    pool.itemId = item.itemId;
    itemPool.pool.push(pool);
    await this.itemPoolRepository.updateById(id, itemPool);
    return itemPool;
  }

  @get('/pools/count')
  @response(200, {
    description: 'ItemPool model count',
    content: {'application/json': {schema: {'x-ts-type': CountSchema}}},
  })
  async count(@param.where(ItemPool) where?: Where<ItemPool>): Promise<Count> {
    return this.itemPoolRepository.count(where);
  }

  @get('/pools')
  @response(200, {
    description: 'Array of ItemPool model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ItemPool, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(ItemPool) filter?: Filter<ItemPool>,
  ): Promise<ItemPool[]> {
    return this.itemPoolRepository.find(filter);
  }

  @patch('/pools')
  @response(200, {
    description: 'ItemPool PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ItemPool, {partial: true}),
        },
      },
    })
    itemPool: ItemPool,
    @param.where(ItemPool) where?: Where<ItemPool>,
  ): Promise<Count> {
    return this.itemPoolRepository.updateAll(itemPool, where);
  }

  @get('/pool/{id}')
  @response(200, {
    description: 'ItemPool model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ItemPool, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(ItemPool, {exclude: 'where'})
    filter?: FilterExcludingWhere<ItemPool>,
  ): Promise<ItemPool> {
    return this.itemPoolRepository.findById(id, filter);
  }

  @patch('/pool/{id}')
  @response(204, {
    description: 'ItemPool PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ItemPool, {partial: true}),
        },
      },
    })
    itemPool: ItemPool,
  ): Promise<void> {
    await this.itemPoolRepository.updateById(id, itemPool);
  }

  @put('/pool/{id}')
  @response(204, {
    description: 'ItemPool PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() itemPool: ItemPool,
  ): Promise<void> {
    await this.itemPoolRepository.replaceById(id, itemPool);
  }

  @del('/pool/{id}')
  @response(204, {
    description: 'ItemPool DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.itemPoolRepository.deleteById(id);
  }
}
