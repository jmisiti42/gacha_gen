import {Client} from '@loopback/testlab';
import {GachaGenApplication} from '../..';
import {
  ItemPool,
  Pool,
  User,
  UserWithPassword
} from '../../models';
import {ItemPoolRepository, UserRepository} from '../../repositories';
import {UserManagementService} from '../../services';
import {setupApplication} from './test-helper';


describe('ItemPoolController', () => {
  let app: GachaGenApplication;
  let client: Client;
  let itemPoolRepo: ItemPoolRepository;
  let userRepo: UserRepository;
  let userManagementService: UserManagementService;
  let adminToken: string;
  let userToken: string;

  const userData = {
    email: 'john@test.com',
    username: 'John',
    roles: ['user'],
  };

  const adminData = {
    email: 'admin@test.com',
    username: 'admin',
    roles: ['admin'],
  };

  const userPassword = 'p4ssw0rd';


  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    itemPoolRepo = await app.get('repositories.ItemPoolRepository');
    userRepo = await app.get('repositories.UserRepository');
    userManagementService = await app.get('services.user.service');

    adminToken = await authenticateUser(
      await createAdmin()
    )
    userToken = await authenticateUser(
      await createUser()
    )
  });


  after(async () => {
    await clearDatabase()
    await app.stop();
  });
  beforeEach(clearPools);

  it('Admin can create an item pool', async () => {
    const itemPool = new ItemPool({})
    itemPool.description = 'Item pool test description'
    itemPool.title = 'Item pool test'
    itemPool.image = 'test.png'
    itemPool.type = 'test'
    await client
      .post('/pool')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(itemPool)
      .expect(200);
  });

  it('User cannot create an item pool', async () => {
    const itemPool = new ItemPool({})
    itemPool.description = 'Item pool test description'
    itemPool.title = 'Item pool test'
    itemPool.image = 'test.png'
    itemPool.type = 'test'
    await client
      .post('/pool')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Content-Type', 'application/json')
      .send(itemPool)
      .expect(403);
  });

  it('Should add an item to ItemPool as an admin', async () => {
    const itemPool = new ItemPool({})
    itemPool.description = 'Item pool test description'
    itemPool.title = 'Item pool test'
    itemPool.image = 'test.png'
    itemPool.type = 'test'
    const {id} = await itemPoolRepo.create(itemPool)
    const pool = new Pool({})
    pool.amount = 1
    pool.minValue = 0
    pool.maxValue = 10
    await client
      .post(`/pool/${id}/item/0`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(pool)
      .expect(200);
  });

  async function clearPools() {
    await itemPoolRepo.deleteAll();
  }

  async function clearDatabase() {
    await userRepo.deleteAll();
  }

  async function createUser() {
    const userWithPassword = new UserWithPassword(userData);
    userWithPassword.password = userPassword;
    return userManagementService.createUser(userWithPassword);
  }

  async function createAdmin() {
    const userWithPassword = new UserWithPassword(adminData);
    userWithPassword.password = userPassword;
    return userManagementService.createUser(userWithPassword);
  }

  async function authenticateUser(user: User) {
    const res = await client
      .post('/user/login')
      .send({email: user.email, password: userPassword});
    return res.body.token;
  }
});
