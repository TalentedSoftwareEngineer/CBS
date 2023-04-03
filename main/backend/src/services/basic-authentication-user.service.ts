import {inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {User} from '../models';
import {CredentialsRepository, CustomerRepository, RoleRepository, UserRepository} from '../repositories';
import {repository} from '@loopback/repository';
import {UserService} from '@loopback/authentication';
import {compare} from 'bcryptjs';
import {Credentials} from '@loopback/authentication-jwt';
import {genSalt, hash} from 'bcryptjs';
import _ from 'lodash';
import {MESSAGES} from '../constants/messages';
import {USER_TYPE} from '../constants/configurations';


export class BasicAuthenticationUserService
  implements UserService<User, Credentials> {
  constructor(
    @repository(CredentialsRepository)
    private credentialsRepository: CredentialsRepository,
    @repository(UserRepository)
    private userRepository: UserRepository,
    @repository(RoleRepository)
    private roleRepository: RoleRepository,
    @repository(CustomerRepository)
    private customerRepository: CustomerRepository,
  ) {
  }

  async verifyCredentials(
    credentials: Credentials,
  ): Promise<any> {
    if (!credentials) {
      throw new HttpErrors.Unauthorized(MESSAGES.NO_CREDENTIALS);
    }

    if (!credentials.email) {
      throw new HttpErrors.Unauthorized(MESSAGES.NO_CREDENTIALS);
    }

    if (!credentials.password) {
      throw new HttpErrors.Unauthorized(MESSAGES.NO_CREDENTIALS);
    }

    const credentialsFound = await this.credentialsRepository.findOne({where: {username: credentials.email}});
    if (!credentialsFound) {
      throw new HttpErrors.Unauthorized(`User with username ${credentials.email} not found.`);
    }

      const credentialsPassword = await hash(credentials.password, credentialsFound.salt);
      if (credentialsPassword != credentialsFound.password) {
          throw new HttpErrors.Unauthorized('The password is not correct.');
      }

      if (credentialsFound.type==USER_TYPE.USER) {
        const foundUser = await this.userRepository.findById(credentialsFound.user_id)
        if (!foundUser)
            throw new HttpErrors.Unauthorized('Invalid username or password');

        if (!foundUser.status)
          throw new HttpErrors.Unauthorized('This account is not activated. Please contact support center.');

        return { type: USER_TYPE.USER, user: foundUser}
      } else {
        const foundUser = await this.customerRepository.findById(credentialsFound.id)
        if (!foundUser)
          throw new HttpErrors.Unauthorized('Invalid username or password');

        if (!foundUser.allowed)
          throw new HttpErrors.Unauthorized('This account is not allowed. Please contact support center.');

        return { type: USER_TYPE.CUSTOMER, user: foundUser}
      }
  }

  convertToUserProfile(credentials: any): UserProfile {
    if (!credentials) {
      throw new HttpErrors.Unauthorized(MESSAGES.NO_CREDENTIALS);
    }

    if (!credentials.user.id) {
      throw new HttpErrors.Unauthorized(MESSAGES.NO_CREDENTIALS);
    }

    return {
      [securityId]: JSON.stringify(credentials),
      id: credentials.user.id,
      name: credentials.user.username,
    };
  }

  async getUserCredentials(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user)
      throw new HttpErrors.Unauthorized(MESSAGES.NO_CREDENTIALS);

    const info = await this.userRepository.getInfo(userId);
    const permissions = await this.roleRepository.getPermissions(user.role_id);
    const customer = await this.userRepository.getCustomer(userId);

    return {user, info, customer, permissions};
  }

  async getUserCredentialsForSecurity(user: User) {
    if (!user)
      throw new HttpErrors.Unauthorized(MESSAGES.NO_CREDENTIALS);

    // const info = await this.userRepository.getInfo(user.id)
    const permissions = await this.roleRepository.getPermissions(user.role_id);
    const customer = await this.userRepository.getCustomer(user.id);

    return {user, permissions, customer};
  }
}