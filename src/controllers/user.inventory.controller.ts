import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {
  repository,
} from '@loopback/repository';
import {
  param,
  post,
  requestBody,
} from '@loopback/rest';
import {InventorySlot, Item} from '../models';
import {UserRepository, ItemPoolRepository} from '../repositories';
import {basicAuthorization} from '../services';
import {OPERATION_SECURITY_SPEC} from '../utils';

/**
 * Controller for User's Orders
 */
export class UserInventoryController {
  constructor(
    @repository(UserRepository)
    protected userRepo: UserRepository,
    @repository(ItemPoolRepository)
    protected itemPoolRepo: ItemPoolRepository
  ) {}

  /**
   * Create or update the orders for a given user
   * @param userId User id
   * @param cart Shopping cart
   */
  @post('/users/{userId}/roll', {
    security: OPERATION_SECURITY_SPEC,
    responses: {
      '200': {
        description: 'User.inventory model instance',
        content: {'application/json': {schema: {'x-ts-type': [InventorySlot]}}},
      },
    },
  })
  @authenticate('jwt')
  @authorize({allowedRoles: ['user'], voters: [basicAuthorization]})
  async roll(
    @param.path.string('userId') userId: string,
    @requestBody() type: string,
  ): Promise<Item | string> {
    const pool = await this.itemPoolRepo.findOne({
      where: {
        type,
      },
    });
    if (!pool) {
      return "ItemPool not found...";
    }
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return "User not found...";
    }
    const itemDropped = pool.rollItem(userId);
    user.addItem(itemDropped);
    await this.userRepo.save(user);
    
    return itemDropped.item;
  }
}
