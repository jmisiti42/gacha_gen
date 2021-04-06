import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  Filter,
  HasManyRepositoryFactory,
  HasOneRepositoryFactory,
  juggler,
  repository,
} from '@loopback/repository';
import {InventorySlot, User, UserCredentials} from '../models';
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

  async addItem(user: User, inventorySlot: InventorySlot): Promise<User> {
    const index = user.inventory.findIndex((slot: InventorySlot) => {
      return slot.id === inventorySlot.id;
    })
    index >= 0 ? user.inventory.push(inventorySlot) : user.inventory[index] = inventorySlot
    return await this.saveUser(user);
  }

  async saveUser(user: User): Promise<User> {
    return this.save(user);
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
