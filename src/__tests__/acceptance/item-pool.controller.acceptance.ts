import {Client} from '@loopback/testlab';
import {GachaGenApplication} from '../..';
import {ItemPool, Pool, User, UserWithPassword} from '../../models';
import {ItemPoolRepository, UserRepository} from '../../repositories';
import {UserService} from '../../services';
import {setupApplication} from './test-helper';

describe('ItemPoolController', () => {
  let app: GachaGenApplication;
  let client: Client;
  let itemPoolRepo: ItemPoolRepository;
  let userRepo: UserRepository;
  let userService: UserService;
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

  const defaultItemPool = new ItemPool({
    description: 'Item pool test description',
    title: 'Item pool test',
    image: 'test.png',
    type: 'test',
  });

  const defaultPool = new Pool({
    amount: 1,
    minValue: 0,
    maxValue: 10,
  });

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    itemPoolRepo = await app.get('repositories.ItemPoolRepository');
    userRepo = await app.get('repositories.UserRepository');
    userService = await app.get('services.user.service');

    adminToken = await authenticateUser(await createAdmin());
    userToken = await authenticateUser(await createUser());
  });

  after(async () => {
    await clearDatabase();
    await app.stop();
  });
  beforeEach(clearPools);

  it('Should create an ItemPool as an admin', async () => {
    await client
      .post('/pool')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItemPool)
      .expect(200);
  });

  it('Should fail to create an ItemPool as an user', async () => {
    await client
      .post('/pool')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItemPool)
      .expect(403);
  });

  it('Should add an item to ItemPool as an admin', async () => {
    const {id} = await itemPoolRepo.create(defaultItemPool);
    await client
      .post(`/pool/${id}/item/0`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultPool)
      .expect(200);
  });

  it('Should fail to add an item to ItemPool as an user', async () => {
    const {id} = await itemPoolRepo.create(defaultItemPool);
    await client
      .post(`/pool/${id}/item/0`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultPool)
      .expect(403);
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
    return userService.createUser(userWithPassword);
  }

  async function createAdmin() {
    const userWithPassword = new UserWithPassword(adminData);
    userWithPassword.password = userPassword;
    return userService.createUser(userWithPassword);
  }

  async function authenticateUser(user: User) {
    const res = await client
      .post('/user/signin')
      .send({email: user.email, password: userPassword});
    return res.body.token;
  }
});
