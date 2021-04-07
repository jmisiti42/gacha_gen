import {Client, expect} from '@loopback/testlab';
import _ from 'lodash';
import {GachaGenApplication} from '../..';
import {Item, User, UserWithPassword} from '../../models';
import {ItemRepository, UserRepository} from '../../repositories';
import {UserManagementService} from '../../services';
import {setupApplication} from './test-helper';

describe.only('itemController', () => {
  let app: GachaGenApplication;
  let client: Client;
  let itemRepo: ItemRepository;
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

  const defaultItem = new Item({
    name: 'Basic Shield',
    rarity: 'common',
    image: 'https://images.unsplash.com/photo-1571380401583-72ca84994796?ixlib=rb1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
    description: 'A basic shield',
    details:
      'elementum consectetur felis et malesuada. Vivamus semper ipsum et ligula maximus viverra. Fusce aliquet, nunc a laoreet pellentesque, leo dui vestibulum justo, a lacinia orci magna vitae magna. Nullam bibendum turpis non ex semper, quis iaculis lacus elementum. Fusce ultricies diam a neque varius, nec pulvinar ante congue.',
  });


  before('setupApplication', async () => {
    try {
      ({app, client} = await setupApplication());
    } catch (e) {
      console.log(e);
    }
    itemRepo = await app.get('repositories.ItemRepository');
    userRepo = await app.get('repositories.UserRepository');
    userManagementService = await app.get('services.user.service');

    adminToken = await authenticateUser(await createAdmin());
    userToken = await authenticateUser(await createUser());
  });

  after(async () => {
    await clearDatabase();
    await app.stop();
  });

  it('Should create two items  with auto itemIdcreation ', async () => {

    const firstItem = await client
      .post('/item')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(200);
    const secondtItem = await client
      .post('/item')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(200);
    expect(parseInt(secondtItem.body.itemId)).to.be.equal(parseInt(firstItem.body.itemId) + 1)

  });

  it('Should fail to create an item with wrong params', async () => {
    const wrongItem: Partial<Item> = _.cloneDeep(defaultItem)
    wrongItem.name = undefined
    await client
      .post('/item')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(wrongItem)
      .expect(422);
  });

  it('Should create an item as an admin', async () => {
    await client
      .post('/item')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(200);
  });

  it('Should fail to create an item as an user', async () => {
    await client
      .post('/item')
      .set('Authorization', `Bearer ${userToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(403);
  });

  it('Should delete an item as an admin', async () => {
    const {id} = await itemRepo.create(defaultItem);
    await client
      .del(`/item/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(204);
  });

  it('Shouldn fail to delete an item as an user', async () => {
    const {id} = await itemRepo.create(defaultItem);
    await client
      .del(`/item/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(403);
  });

  it('Should modify an item as an an admin', async () => {
    const {id} = await itemRepo.create(defaultItem);
    await client
      .patch(`/item/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(204);
  });

  it('Should fail to modify an item as an user', async () => {
    const {id} = await itemRepo.create(defaultItem);
    await client
      .patch(`/item/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('Content-Type', 'application/json')
      .send(defaultItem)
      .expect(403);
  });

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
