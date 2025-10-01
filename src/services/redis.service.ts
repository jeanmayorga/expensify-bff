import { env } from "@/config/env";
import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let redisConnectPromise: Promise<RedisClient> | null = null;

export class RedisService {
  private redis!: RedisClient;

  constructor() {
    if (redisClient) {
      console.log("RedisService->getClient()->cached client");
      this.redis = redisClient;
      return;
    }

    if (!env.REDIS_URL) {
      console.warn(
        "RedisService-> No REDIS_URL provided. Redis will not connect."
      );
    }

    console.log("RedisService->getClient()->creating new client");
    const client = createClient({ url: env.REDIS_URL });
    client.on("error", (err) => console.error("RedisService->error->", err));

    redisClient = client;
    this.redis = client;

    if (!redisConnectPromise) {
      redisConnectPromise = client
        .connect()
        .then(() => {
          console.log("RedisService->connected");
          return client;
        })
        .catch((err) => {
          console.error("RedisService->connect error->", err);
          // Allow retry on next operation
          redisConnectPromise = null;
          throw err;
        });
    }
  }

  private async ensureConnected(): Promise<void> {
    if (redisConnectPromise) {
      await redisConnectPromise;
      return;
    }
    redisConnectPromise = this.redis.connect().then(() => this.redis);
    await redisConnectPromise;
  }

  isConnected(): boolean {
    return this.redis.isOpen;
  }

  async set(key: string, value: string) {
    console.log("RedisService->set()", key);
    await this.ensureConnected();
    return await this.redis.set(key, value);
  }

  async get(key: string) {
    console.log("RedisService->get()", key);
    await this.ensureConnected();
    return await this.redis.get(key);
  }
}
