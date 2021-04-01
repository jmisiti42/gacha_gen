import {AuthenticationComponent} from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  TokenServiceBindings,
} from '@loopback/authentication-jwt';
import {AuthorizationComponent} from '@loopback/authorization';
import {BootMixin} from '@loopback/boot';
import {
  ApplicationConfig,
  BindingKey,
  createBindingFromClass,
} from '@loopback/core';
import {RepositoryMixin, SchemaMigrationOptions} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {PasswordHasherBindings, UserServiceBindings} from './keys';
import {UserWithPassword} from './models';
import {
  ItemRepository,
  UserCredentialsRepository,
  UserRepository,
} from './repositories';
import {MySequence} from './sequence';
import {
  UserManagementService,
  BcryptHasher,
  SecuritySpecEnhancer,
  JWTService,
} from './services';
import YAML = require('yaml');
import {ErrorHandlerMiddlewareProvider} from './middlewares';
import {InventorySlotRepository} from './repositories/inventory-slot.repository';

/**
 * Information from package.json
 */
export interface PackageInfo {
  name: string;
  version: string;
  description: string;
}
export const PackageKey = BindingKey.create<PackageInfo>('application.package');

const pkg: PackageInfo = require('../package.json');

export class GachaGenApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options?: ApplicationConfig) {
    super(options);

    // Bind authentication component related elements
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    this.component(AuthorizationComponent);

    this.setUpBindings();

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.bind(RestExplorerBindings.CONFIG).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }

  setUpBindings(): void {
    // Bind package.json to the application context
    this.bind(PackageKey).to(pkg);

    // Bind bcrypt hash services
    this.bind(PasswordHasherBindings.ROUNDS).to(10);
    this.bind(PasswordHasherBindings.PASSWORD_HASHER).toClass(BcryptHasher);
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    this.bind(UserServiceBindings.USER_SERVICE).toClass(UserManagementService);
    this.add(createBindingFromClass(SecuritySpecEnhancer));

    this.add(createBindingFromClass(ErrorHandlerMiddlewareProvider));

    // Use JWT secret from JWT_SECRET environment variable if set
    // otherwise create a random string of 64 hex digits
    const secret =
      process.env.JWT_SECRET ?? crypto.randomBytes(32).toString('hex');
    this.bind(TokenServiceBindings.TOKEN_SECRET).to(secret);
  }

  // Unfortunately, TypeScript does not allow overriding methods inherited
  // from mapped types. https://github.com/microsoft/TypeScript/issues/38496
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  async start(): Promise<void> {
    // Use `databaseSeeding` flag to control if items/users should be pre
    // populated into the database. Its value is default to `true`.
    if (this.options.databaseSeeding !== true) {
      await this.migrateSchema();
    }
    return super.start();
  }

  async migrateSchema(options?: SchemaMigrationOptions): Promise<void> {
    await super.migrateSchema(options);
    // Pre-populate items
    const itemRepo = await this.getRepository(ItemRepository);
    await itemRepo.deleteAll();
    const itemsDir = path.join(__dirname, '../fixtures/items');
    const itemFiles = fs.readdirSync(itemsDir);

    for (const file of itemFiles) {
      if (file.endsWith('.yml')) {
        const itemFile = path.join(itemsDir, file);
        const yamlString = fs.readFileSync(itemFile, 'utf8');
        const item = YAML.parse(yamlString);
        await itemRepo.create(item);
      }
    }

    // Pre-populate users
    const userRepo = await this.getRepository(UserRepository);
    await userRepo.deleteAll();
    const userCredentialsRepo = await this.getRepository(
      UserCredentialsRepository,
    );
    await userCredentialsRepo.deleteAll();
    const usersDir = path.join(__dirname, '../fixtures/users');
    const userFiles = fs.readdirSync(usersDir);

    for (const file of userFiles) {
      if (file.endsWith('.yml')) {
        const userFile = path.join(usersDir, file);
        const yamlString = YAML.parse(fs.readFileSync(userFile, 'utf8'));
        const userWithPassword = new UserWithPassword(yamlString);
        const userManagementService = await this.get<UserManagementService>(
          UserServiceBindings.USER_SERVICE,
        );
        await userManagementService.createUser(userWithPassword);
      }
    }

    // Delete existing orders
    const inventorySlotRepo = await this.getRepository(InventorySlotRepository);
    await inventorySlotRepo.deleteAll();
  }
}
