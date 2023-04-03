// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';


import {repository} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response, HttpErrors,
} from '@loopback/rest';
import {ConfigurationRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {ConfigurationRequest} from '../models/configuration.request';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {PERMISSIONS} from '../constants/permissions';
import {MESSAGES} from '../constants/messages';
import {CONFIGURATIONS} from '../constants/configurations';
import {inject} from '@loopback/core';

@authenticate('jwt')
export class ConfigurationController {
  constructor(
    @repository(ConfigurationRepository)
    public configurationRepository : ConfigurationRepository,
  ) {}

  @patch('/configurations/logo')
  @response(204, {
    description: 'Configuration PATCH success',
  })
  async updateLogo(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: "object",
            properties: {
              value: {
                type: "string",
              },
            },
          },
        },
      },
    })
      config: ConfigurationRequest,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_LOGO_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.configurationRepository.updateById(CONFIGURATIONS.LOGO, {value: config.value});
  }

  @patch('/configurations/banner')
  @response(204, {
    description: 'Configuration PATCH success',
  })
  async updateBanner(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: "object",
            properties: {
              value: {
                type: "string",
              },
            },
          },
        },
      },
    })
      config: ConfigurationRequest,
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile,
  ): Promise<void> {
    const profile = JSON.parse(currentUserProfile[securityId]);
    if (!profile.permissions.includes(PERMISSIONS.WRITE_BANNER_MANAGEMENT))
      throw new HttpErrors.Unauthorized(MESSAGES.NO_PERMISSION)

    await this.configurationRepository.updateById(CONFIGURATIONS.BANNER, {value: config.value});
  }

}
