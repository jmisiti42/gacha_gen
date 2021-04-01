import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  Filter,
  HasManyRepositoryFactory,
  HasOneRepositoryFactory,
  juggler,
  repository,
} from '@loopback/repository';
import {InventorySlot, Item, User, UserCredentials} from '../models';
import {InventorySlotRepository} from './inventory-slot.repository';
import {UserCredentialsRepository} from './user-credentials.repository';

export type Credentials = {
  email: string;
  password: string;
};

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id
> {
  public inventory: HasManyRepositoryFactory<
  InventorySlot,
    typeof User.prototype.id
  >;

  public readonly userCredentials: HasOneRepositoryFactory<
    UserCredentials,
    typeof User.prototype.id
  >;

  constructor(
    @inject('datasources.mongo') dataSource: juggler.DataSource,
    @repository(InventorySlotRepository)
    protected inventorySlotRepository: InventorySlotRepository,
    @repository.getter('UserCredentialsRepository')
    protected userCredentialsRepositoryGetter: Getter<UserCredentialsRepository>,
  ) {
    super(User, dataSource);
    this.userCredentials = this.createHasOneRepositoryFactoryFor(
      'userCredentials',
      userCredentialsRepositoryGetter,
    );

    this.inventory = this.createHasManyRepositoryFactoryFor(
      'inventory',
      async () => inventorySlotRepository,
    );
  }

  async addItem(
    userId: typeof User.prototype.id,
    item: Item,
    amount: number = 1,
  ) {
    return await this.inventorySlotRepository.updateAll({
      item,
      amount,
    }, {
      itemId: item.itemId,
      userId,
    }, {
      new: true, //Return the updated value
      upsert: true, //Create slot if not exist
    })
  }

  async findCredentials(
    userId: typeof User.prototype.id,
  ): Promise<UserCredentials | undefined> {
    try {
      return await this.userCredentials(userId).get();
    } catch (err) {
      if (err.code === 'ENTITY_NOT_FOUND') {
        return undefined;
      }
      throw err;
    }
  }
}
