import {get, getModelSchemaRef, HttpErrors, param, post, requestBody} from '@loopback/rest';
import {authenticate, TokenService} from "@loopback/authentication";
import {TokenServiceBindings, UserServiceBindings} from "@loopback/authentication-jwt";
import {inject} from "@loopback/core";
import {Customer, User, UserInfo} from '../models';
import {SecurityBindings, securityId, UserProfile} from "@loopback/security";
import {BasicAuthenticationUserService} from "../services";
import {USER_TYPE} from '../constants/configurations';

export type UserAuthenticateRequest = {
  username: string;
  password: string;
};

export class AuthenticateController {
  constructor(
    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: TokenService,

    @inject(UserServiceBindings.USER_SERVICE)
    public userService: BasicAuthenticationUserService,
  ) {}

  @post('/authenticate', {
    description: 'Authenticate user credentials and generated token',
    responses: {
      '200': {
        description: 'token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                user_id: {
                  type: 'number',
                }
              },
            },
          },
        },
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                example: 'sadmin'
              },
              password: {
                type: 'string',
                example: 'sadmin'
              }
            }
          }
        },
      },
    })
      request: UserAuthenticateRequest,
  ): Promise<any> {

    const user = await this.userService.verifyCredentials({email: request.username, password: request.password});
    if (user.type==USER_TYPE.USER) {
      const credentials = await this.userService.getUserCredentialsForSecurity(user.user);
      const profile = this.userService.convertToUserProfile(credentials);
      const token = await this.jwtService.generateToken(profile);

      return {token: token, user_id: user.id!};
    } else {
      throw new HttpErrors.Unauthorized('Please contact support center.');
    }
  }

  @authenticate('jwt')
  @get('/authorization', {
    description: 'get Authenticated user credentials',
    responses: {
      '200': {
        content: {
          'application/json': {
            schema: {
              type: "object",
              properties: {
                user: {
                  'x-ts-type': User
                },
                info: {
                  'x-ts-type': UserInfo
                },
                customer: {
                  'x-ts-type': Customer
                },
                permissions: {
                  type: "array",
                  items: {
                    type: "integer"
                  }
                },
              }
            }
          },
        },
      },
    },
  })
  async user(@inject(SecurityBindings.USER) currentUserProfile: UserProfile): Promise<any> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    const credentials = await this.userService.getUserCredentials(profile.user.id);
    return credentials;
  }
}
