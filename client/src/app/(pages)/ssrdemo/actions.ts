'use server';

import { ssrMutate, ssrMutateAndRevalidate, ssrRevalidate } from '@/hooks/ssrMutate';

/**
 * Server Action: Mutate cache without revalidation
 */
export async function mutateCacheAction(serviceKey: string, value: string) {
  return await ssrMutate({
    serviceKey,
    value,
  });
}

/**
 * Server Action: Mutate and revalidate cache
 */
export async function mutateAndRevalidateAction(serviceKey: string, value: string) {
  return await ssrMutateAndRevalidate({
    serviceKey,
    value,
  });
}

/**
 * Server Action: Mutate cache by tags
 */
export async function mutateCacheByTagsAction(tags: string[], value: string) {
  return await ssrMutate({
    tags,
    value,
  });
}

/**
 * Server Action: Revalidate cache (delete and force refetch)
 */
export async function revalidateCacheAction(serviceKey: string, tags: string[]) {
  return await ssrRevalidate({
    serviceKey,
    tags,
  });
}
