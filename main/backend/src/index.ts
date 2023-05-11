import {ApplicationConfig, BackendApplication} from './application';
import {PRIVATE_KEY, PUBLIC_KEY, SERVER} from './config';

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new BackendApplication(options);
  await app.basePath("/api/v1");
  await app.restServer.basePath("/api/v1");
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config: any = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.NODE_ENV=='production' ? SERVER : process.env.HOST,
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      // gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400000,
      credentials: true,
      requestBodyParser: {json: {limit: '25mb'}, text: {limit: '25mb'}}
    },
  };

  if (process.env.NODE_ENV=='production' || process.env.NODE_ENV=='development') {
    const fs = require("fs");
    config.rest.protocol = 'https';
    config.rest.key = fs.readFileSync(PRIVATE_KEY).toString();
    config.rest.cert = fs.readFileSync(PUBLIC_KEY).toString();

    // console.log(config.rest.key, config.rest.cert)
  }

  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
