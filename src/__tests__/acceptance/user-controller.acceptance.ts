import {TokenServiceBindings} from '@loopback/authentication-jwt';
import {securityId} from '@loopback/security';
import {Client, expect} from '@loopback/testlab';
import {HTTPError} from 'superagent';
import {GachaGenApplication} from '../..';
import {UserController} from '../../controllers';
import {KeyAndPassword, UserWithPassword} from '../../models';
import {UserRepository} from '../../repositories';
import {JWTService, UserService} from '../../services';
import {setupApplication} from './test-helper';

describe('UserController', () => {
  let app: GachaGenApplication;
  let client: Client;
  let userService: UserService;
  let userRepo: UserRepository;
  let controller: UserController;

  const userData = {
    email: 'test@loopback.io',
    username: 'Example',
    roles: ['user'],
  };

  const userPassword = 'p4ssw0rd';
  let expiredToken: string;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    userRepo = await app.get('repositories.UserRepository');
    userService = await app.get('services.user.service');
    // link tests to controller
    expect(controller).to.be.undefined();
  });
  before(migrateSchema);
  before(givenAnExpiredToken);

  beforeEach(clearDatabase);

  after(async () => {
    await app.stop();
  });

  it('Should create a new user when user signup is invoked', async () => {
    const res = await client
      .post('/user/signup')
      .send({...userData, password: userPassword})
      .expect(200);

    expect(res.body.email).to.equal('test@loopback.io');
    expect(res.body.username).to.equal('Example');
    expect(res.body).to.have.property('id');
    expect(res.body).to.not.have.property('password');
  });

  it('Should throw an error for user signup with a missing email', async () => {
    const res = await client
      .post('/user/signup')
      .send({
        password: 'p4ssw0rd',
        username: 'Example',
      })
      .expect(422);

    expect(res.error).to.not.eql(false);
    const resError = res.error as HTTPError;
    const errorText = JSON.parse(resError.text);
    expect(errorText.error.details[0].info.missingProperty).to.equal('email');
  });

  it('Should throw an error for user signup with an invalid email', async () => {
    const res = await client
      .post('/user/signup')
      .send({
        email: 'test@loop&back.io',
        password: 'p4ssw0rd',
        username: 'Example',
      })
      .expect(422);

    expect(res.body.error.message).to.equal('invalid email');
  });

  it('Should throw an error for user signup with a missing password', async () => {
    const res = await client
      .post('/user/signup')
      .send({
        email: 'test@loopback.io',
        username: 'Example',
      })
      .expect(422);

    expect(res.error).to.not.eql(false);
    const resError = res.error as HTTPError;
    const errorText = JSON.parse(resError.text);
    expect(errorText.error.details[0].info.missingProperty).to.equal(
      'password',
    );
  });

  it('Should throw an error for user signup with a string', async () => {
    const res = await client.post('/user/signup').send('hello').expect(415);
    expect(res.body.error.message).to.equal(
      'Content-type application/x-www-form-urlencoded does not match [application/json].',
    );
  });

  it('Should throw an error for user signup with an existing email', async () => {
    await client
      .post('/user/signup')
      .send({...userData, password: userPassword})
      .expect(200);
    const res = await client
      .post('/user/signup')
      .send({...userData, password: userPassword})
      .expect(409);

    expect(res.body.error.message).to.equal('Email value is already taken');
  });

  it('Should protect GET /user/{id} with authorization', async () => {
    const newUser = await createAUser();
    await client.get(`/user/${newUser.id}`).expect(401);
  });

  describe('forgot-password', () => {
    it('Should throw an error for PUT /user/forgot-password when resetting password for non logged in account', async () => {
      const token = await authenticateUser();
      const res = await client
        .put('/user/forgot-password')
        .set('Authorization', 'Bearer ' + token)
        .send({
          email: 'john@example.io',
          password: 'p4ssw0rd',
        })
        .expect(403);

      expect(res.body.error.message).to.equal('Invalid email address');
    });

    it('Should return an error when invalid password is used', async () => {
      const token = await authenticateUser();

      const res = await client
        .put('/user/forgot-password')
        .set('Authorization', 'Bearer ' + token)
        .send({email: 'test@example.com', password: '12345'})
        .expect(422);

      expect(res.body.error.details[0].message).to.equal(
        'Should NOT be shorter than 8 characters',
      );
    });

    it('Should return a token for a successful password reset', async () => {
      const token = await authenticateUser();

      const res = await client
        .put('/user/forgot-password')
        .set('Authorization', 'Bearer ' + token)
        .send({email: userData.email, password: 'password@12345678'})
        .expect(200);

      expect(res.body.token).to.not.be.empty();
    });
  });

  describe('reset-password-init', () => {
    it('Should throw an error for POST /user/reset-password-init with an invalid email', async () => {
      const res = await client
        .post('/user/reset-password/init')
        .send({email: 'john'})
        .expect(422);
      expect(res.body.error.message).to.equal('Invalid email address');
    });

    it('Should throw an error for POST /user/reset-password-init for non-existent account email', async () => {
      const res = await client
        .post('/user/reset-password/init')
        .send({email: 'john@example'})
        .expect(404);
      expect(res.body.error.message).to.equal(
        'No account associated with the provided email address.',
      );
    });

    it('Should throw an error if email config is invalid', async () => {
      const tempData = {
        email: 'john@loopback.io',
        username: 'Example',
        roles: ['user'],
        resetKey: '',
      };

      await client
        .post('/user/signup')
        .send({...tempData, password: userPassword})
        .expect(200);

      await client
        .post('/user/reset-password/init')
        .send({email: 'john@loopback.io'})
        .expect(500);
    });

    // TODO (mrmodise) configure environment variables in pipelines to add positive scenario test cases
  });

  describe('reset-password-finish', () => {
    it('Should throw an error for PUT /user/reset-password-finish with an invalid key', async () => {
      const res = await client
        .put('/user/reset-password/finish')
        .send(
          new KeyAndPassword({
            resetKey: 'john',
            password: 'password1234',
            confirmPassword: 'password1234',
          }),
        )
        .expect(404);
      expect(res.body.error.message).to.equal(
        'No associated account for the provided reset key',
      );
    });

    it('Should throw an error for PUT /user/reset-password-finish with mismatch passwords', async () => {
      const res = await client
        .put('/user/reset-password/finish')
        .send(
          new KeyAndPassword({
            resetKey: 'john',
            password: 'password123',
            confirmPassword: 'password1234',
          }),
        )
        .expect(422);
      expect(res.body.error.message).to.equal(
        'password and confirmation password do not match',
      );
    });
  });

  describe('authentication', () => {
    it('login returns a JWT token', async () => {
      const newUser = await createAUser();

      const res = await client
        .post('/user/signin')
        .send({email: newUser.email, password: userPassword})
        .expect(200);

      const token = res.body.token;
      expect(token).to.not.be.empty();
    });

    it('Should return an error when invalid email is used', async () => {
      await createAUser();

      const res = await client
        .post('/user/signin')
        .send({email: 'idontexist@example.com', password: userPassword})
        .expect(401);

      expect(res.body.error.message).to.equal('Invalid email or password.');
    });

    it('Should return an error when invalid password is used', async () => {
      const newUser = await createAUser();

      const res = await client
        .post('/user/signin')
        .send({email: newUser.email, password: 'wrongpassword'})
        .expect(401);

      expect(res.body.error.message).to.equal('Invalid email or password.');
    });

    it('Should return the current user profile when a valid JWT token is provided', async () => {
      const newUser = await createAUser();

      let res = await client
        .post('/user/signin')
        .send({email: newUser.email, password: userPassword})
        .expect(200);

      const token = res.body.token;

      res = await client
        .get('/user/me')
        .set('Authorization', 'Bearer ' + token)
        .expect(200);

      const userProfile = res.body;
      expect(userProfile.id).to.equal(newUser.id);
      expect(userProfile.username).to.equal(newUser.username);
      expect(userProfile.roles).to.deepEqual(newUser.roles);
    });

    it('Should return an error when a JWT token is not provided', async () => {
      const res = await client.get('/user/me').expect(401);

      expect(res.body.error.message).to.equal(
        'Authorization header not found.',
      );
    });

    it('Should return an error when an invalid JWT token is provided', async () => {
      const res = await client
        .get('/user/me')
        .set('Authorization', 'Bearer ' + 'xxx.yyy.zzz')
        .expect(401);

      expect(res.body.error.message).to.equal(
        'Error verifying token : invalid token',
      );
    });

    it(`Should return an error when 'Bearer ' is not found in Authorization header`, async () => {
      const res = await client
        .get('/user/me')
        .set('Authorization', 'NotB3@r3r ' + 'xxx.yyy.zzz')
        .expect(401);

      expect(res.body.error.message).to.equal(
        "Authorization header is not of type 'Bearer'.",
      );
    });

    it('Should returns an error when an expired JWT token is provided', async () => {
      const res = await client
        .get('/user/me')
        .set('Authorization', 'Bearer ' + expiredToken)
        .expect(401);

      expect(res.body.error.message).to.equal(
        'Error verifying token : jwt expired',
      );
    });
  });

  async function clearDatabase() {
    await userRepo.deleteAll();
  }

  async function migrateSchema() {
    await app.migrateSchema();
  }

  async function createAUser() {
    const userWithPassword = new UserWithPassword(userData);
    userWithPassword.password = userPassword;
    return userService.createUser(userWithPassword);
  }

  /**
   * Creates an expired token
   *
   * Specifying a negative value for 'expiresIn' so the
   * token is automatically expired
   */
  async function givenAnExpiredToken() {
    const newUser = await createAUser();
    const jwtSecret = app.getSync<string>(TokenServiceBindings.TOKEN_SECRET);
    const tokenService: JWTService = new JWTService(jwtSecret, '-1');
    const userProfile = {
      [securityId]: newUser.id,
      username: newUser.username,
    };
    expiredToken = await tokenService.generateToken(userProfile);
  }

  async function authenticateUser() {
    const user = await createAUser();

    const res = await client
      .post('/user/signin')
      .send({email: user.email, password: userPassword})
      .expect(200);

    return res.body.token;
  }
});
