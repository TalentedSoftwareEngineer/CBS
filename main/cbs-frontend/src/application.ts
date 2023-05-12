import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, createBindingFromClass} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestBindings} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import {DbDataSource} from './datasources';
import {JWTAuthenticationComponent, TokenServiceBindings, UserServiceBindings} from '@loopback/authentication-jwt';
import {CronComponent} from '@loopback/cron';
import {AuthorizationComponent} from '@loopback/authorization';
import {CredentialsRepository, UserRepository} from './repositories';
import {
  BasicAuthenticationUserService, BillingService,
  CdrService,
  CustomerService,
  FtpService,
  RoleService,
  UploadService,
} from './services';
import {AuthenticationComponent} from '@loopback/authentication';
import {LergAutoImport} from './jobs/lerg-auto-import';
import {CdrAutoImport} from './jobs/cdr-auto-import';
import {LrnAutoImport} from './jobs/lrn-auto-import';

export {ApplicationConfig};

export class BackendApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
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

    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);

    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    this.component(CronComponent)
    this.component(AuthorizationComponent);

    // @ts-ignore
    this.bind(UserServiceBindings.USER_SERVICE).toClass(BasicAuthenticationUserService);
    // this.bind(UserServiceBindings.USER_REPOSITORY).toClass(UserRepository);
    // this.bind(UserServiceBindings.USER_CREDENTIALS_REPOSITORY).toClass(CredentialsRepository);

    this.bind(TokenServiceBindings.TOKEN_SECRET).to("cbs_token");
    this.bind(TokenServiceBindings.TOKEN_EXPIRES_IN).to("86400");

    this.service(RoleService)
    this.service(UploadService)
    this.service(CustomerService)
    this.service(FtpService)
    this.service(CdrService)
    this.service(BillingService)

    // cron jobs
    const cdrAuoImportBinding = createBindingFromClass(CdrAutoImport)
    this.add(cdrAuoImportBinding)

    const lergAutoUpdateBinding = createBindingFromClass(LergAutoImport)
    this.add(lergAutoUpdateBinding)
  }
}
