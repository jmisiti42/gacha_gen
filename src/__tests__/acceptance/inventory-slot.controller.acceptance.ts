// import {Client, expect} from '@loopback/testlab';
// import {GachaGenApplication} from '../..';
// import {InventoryRepository} from '../../repositories';
// import {
//   UserWithPassword,
//   Inventory,
//   Item,
//   User,
// } from '../../models';
// import {setupApplication} from './test-helper';
// import {UserManagementService} from '../../services';

// describe('ShoppingCartController', () => {
//   let app: GachaGenApplication;
//   let client: Client;
//   let invRepo: InventoryRepository;
//   let userManagementService: UserManagementService;

//   const userData = {
//     email: 'john@test.com',
//     username: 'John',
//   };

//   const userPassword = 'p4ssw0rd';

//   before('setupApplication', async () => {
//     ({app, client} = await setupApplication());
//     invRepo = await app.get('repositories.InventoryRepository');
//     userManagementService = await app.get('services.user.service');
//   });
//   after(async () => {
//     await app.stop();
//   });
//   beforeEach(clearDatabase);

//   it('protects inventory with authorization', async () => {
//     const inv = givenInventory();
//     await client
//       .post(`/inventory/${inv.userId}`)
//       .set('Content-Type', 'application/json')
//       .send(imv)
//       .expect(401);
//   });

//   it('sets a shopping cart for a user', async () => {
//     userData.email = 'userA@loopback.io';
//     const user = await givenAUser();
//     const token = await authenticateUser(user);
//     const cart = givenShoppingCart(user.id);
//     await client
//       .post(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .set('Content-Type', 'application/json')
//       .send(cart)
//       .expect(204);
//   });

//   it('throws error if userId does not match the cart', async () => {
//     userData.email = 'userB@loopback.io';
//     const user = await givenAUser();
//     const token = await authenticateUser(user);
//     const cart = givenShoppingCart(user.id);
//     await client
//       .post('/shoppingCarts/non-existant-id')
//       .set('Authorization', 'Bearer ' + token)
//       .set('Content-Type', 'application/json')
//       .send(cart)
//       .expect(403);
//   });

//   it('returns a shopping cart', async () => {
//     userData.email = 'userC@loopback.io';
//     const user = await givenAUser();
//     const token = await authenticateUser(user);
//     const cart = givenShoppingCart(user.id);
//     await client
//       .get(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .expect(404);
//     await client
//       .post(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .send(cart)
//       .expect(204);
//     await client
//       .get(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .expect(200, cart.toJSON());
//   });

//   it('deletes a shopping cart', async () => {
//     userData.email = 'userD@loopback.io';
//     const user = await givenAUser();
//     const token = await authenticateUser(user);
//     const cart = givenShoppingCart(user.id);
//     // Set the shopping cart
//     await client
//       .post(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .send(cart)
//       .expect(204);
//     // Now we can see it
//     await client
//       .get(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .expect(200, cart.toJSON());
//     // Delete the shopping cart
//     await client
//       .del(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .expect(204);
//     // Now it's gone
//     await client
//       .get(`/shoppingCarts/${cart.userId}`)
//       .set('Authorization', 'Bearer ' + token)
//       .expect(404);
//   });

//   async function clearDatabase() {
//     await invRepo.deleteAll();
//   }

//   function givenAnItem(item?: Inventory) {
//     return new Inventory(
//       Object.assign(
//         {
//           itemId: '0',
//           name: 'Basic Sword',
//           description: 'A Basic Sword',
//           details: 'Details about that basic sword',
//         },
//         item,
//       ),
//     );
//   }

//   function givenInventory(userId = '0') {
//     return new Inventory({
//       userId: userId,
//       amount: Math.round(Math.random() / 10),
//       itemId: '0',
//     });
//   }

//   async function givenAUser() {
//     const userWithPassword = new UserWithPassword(userData);
//     userWithPassword.password = userPassword;
//     return userManagementService.createUser(userWithPassword);
//   }

//   async function authenticateUser(user: User) {
//     const res = await client
//       .post('/users/login')
//       .send({email: user.email, password: userPassword});
//     return res.body.token;
//   }
// });