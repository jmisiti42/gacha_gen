import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  repository,
} from '@loopback/repository';
import {ItemPoolRepository} from '.';
import {MongoDataSource} from '../datasources';
import {ItemPool, Pool, PoolRelations} from '../models';

export class PoolRepository extends DefaultCrudRepository<
  Pool,
  typeof Pool.prototype.id,
  PoolRelations
> {
  public readonly itemPool: BelongsToAccessor<
    // use the relation name
    ItemPool,
    typeof ItemPool.prototype.id
  >;
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
    @repository.getter('ItemPoolRepository')
    protected itemPoolRepositoryGetter: Getter<ItemPoolRepository>,
  ) {
    super(Pool, dataSource);
    // make sure the name is correct
    this.itemPool = this.createBelongsToAccessorFor(
      'itemPool',
      this.itemPoolRepositoryGetter,
    );

    // make sure the name is correct
    this.registerInclusionResolver('itemPool', this.itemPool.inclusionResolver);
  }
}
