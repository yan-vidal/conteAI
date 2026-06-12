import { MongoMemoryServer } from "mongodb-memory-server";

export interface MongoMemoryTestServer {
  uri: string;
  stop: () => Promise<void>;
}

export const createMongoMemoryTestServer =
  async (): Promise<MongoMemoryTestServer> => {
    const server = await MongoMemoryServer.create();

    return {
      uri: server.getUri(),
      stop: async () => {
        await server.stop();
      },
    };
  };
