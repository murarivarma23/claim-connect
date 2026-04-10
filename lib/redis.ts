import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// A simple rate limiting utility using Redis
export const rateLimit = async (identifier: string, limit: number, windowSeconds: number): Promise<boolean> => {
    const key = `ratelimit:${identifier}`;
    const current = await redis.incr(key);

    if (current === 1) {
        // If it's the first request, set the expiration
        await redis.expire(key, windowSeconds);
    }

    return current <= limit;
};
