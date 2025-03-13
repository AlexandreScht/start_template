'use server';

import redis from '@/libs/redis';

export default async function cacheSync(key: string) {
  await redis.set(key);
}
