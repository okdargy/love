import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    redis.on("error", () => {
      redis = null;
    });
  }
  return redis;
}

export async function cachedFetch<T>(
  key: string,
  ttl: number, // in minutes
  fetcher: () => Promise<T>,
): Promise<T> {
  const client = getRedis();

  if (client) {
    try {
      const cached = await client.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // cache miss or redis down, fall through
    }
  }

  const data = await fetcher();

  if (client) {
    try {
      await client.setex(key, ttl * 60, JSON.stringify(data));
    } catch {
      // silently ignore cache write failures
    }
  }

  return data;
}
