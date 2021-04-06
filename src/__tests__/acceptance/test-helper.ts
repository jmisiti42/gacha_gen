import {GachaGenApplication} from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';

export interface AppWithClient {
  app: GachaGenApplication;
  client: Client;
}

export async function setupApplication(): Promise<AppWithClient> {
  const app = new GachaGenApplication({
    rest: givenHttpServerConfig(),
    databaseSeeding: false,
  });

  await app.boot();
  await app.start();

  const client = createRestAppClient(app);

  return {app, client};
}
