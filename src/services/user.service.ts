import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import _ from 'lodash';
import {v4 as uuidv4} from 'uuid';
import {PasswordHasherBindings} from '../keys';
import {NodeMailer, User, UserWithPassword} from '../models';
import {Credentials, UserRepository} from '../repositories';
import {subtractDates} from '../utils';
import {EmailService} from './email.service';
import {PasswordHasher} from './hash.password.bcryptjs';

export class UserManagementService implements UserService<User, Credentials> {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public passwordHasher: PasswordHasher,
    @inject('services.EmailService')
    public emailService: EmailService,
  ) {}

  async verifyCredentials(credentials: Credentials): Promise<User> {
    const {email, password} = credentials;
    const invalidCredentialsError = 'Invalid email or password.';

    if (!email) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }
    const foundUser = await this.userRepository.findOne({
      where: {email},
    });
    if (!foundUser) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const credentialsFound = await this.userRepository.findCredentials(
      foundUser.id,
    );
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    const passwordMatched = await this.passwordHasher.comparePassword(
      password,
      credentialsFound.password,
    );

    if (!passwordMatched) {
      throw new HttpErrors.Unauthorized(invalidCredentialsError);
    }

    return foundUser;
  }

  async createUser(userWithPassword: UserWithPassword): Promise<User> {
    const password = await this.passwordHasher.hashPassword(
      userWithPassword.password,
    );
    userWithPassword.password = password;
    const user = await this.userRepository.create(
      _.omit(userWithPassword, 'password'),
    );
    user.id = user.id.toString();
    await this.userRepository.userCredentials(user.id).create({password});
    return user;
  }

  async requestPasswordReset(email: string): Promise<NodeMailer> {
    const noAccountFoundError =
      'No account associated with the provided email address.';
    const foundUser = await this.userRepository.findOne({
      where: {email},
    });

    if (!foundUser) {
      throw new HttpErrors.NotFound(noAccountFoundError);
    }

    const user = await this.updateResetRequestLimit(foundUser);

    await this.userRepository.saveUser(user);
    return this.emailService.sendResetPasswordMail(user);
  }

  convertToUserProfile(user: User): UserProfile {
    // since first name and lastName are optional, no error is thrown if not provided
    return {
      [securityId]: user.id,
      username: user.username,
      id: user.id,
      roles: user.roles,
    };
  }

  /**
   * Checks user reset timestamp if its same day increase count
   * otherwise set current date as timestamp and start counting
   * For first time reset request set reset count to 1 and assign same day timestamp
   * @param user
   */
  async updateResetRequestLimit(user: User): Promise<User> {
    const resetTimestampDate = new Date(user.resetTimestamp);

    const difference = await subtractDates(resetTimestampDate);

    if (difference === 0) {
      user.resetCount = user.resetCount + 1;

      if (user.resetCount > +(process.env.PASSWORD_RESET_EMAIL_LIMIT ?? 2)) {
        throw new HttpErrors.TooManyRequests(
          'Account has reached daily limit for sending password-reset requests',
        );
      }
    } else {
      user.resetTimestamp = new Date().toLocaleDateString();
      user.resetCount = 1;
    }
    // For generating unique reset key there are other options besides the proposed solution below.
    // Feel free to use whatever option works best for your needs
    user.resetKey = uuidv4();
    user.resetKeyTimestamp = new Date().toLocaleDateString();

    return user;
  }

  /**
   * Ensures reset key is only valid for a day
   * @param user
   */
  async validateResetKeyLifeSpan(user: User): Promise<User> {
    const resetKeyLifeSpan = new Date(user.resetKeyTimestamp);
    const difference = await subtractDates(resetKeyLifeSpan);

    user.resetKey = '';
    user.resetKeyTimestamp = '';

    if (difference !== 0) {
      throw new HttpErrors.BadRequest('The provided reset key has expired.');
    }

    return user;
  }
}
