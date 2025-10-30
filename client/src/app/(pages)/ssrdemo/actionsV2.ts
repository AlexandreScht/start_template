'use server';

import { mutateCache, revalidateCache } from '@/utils/mutateCache';

/**
 * Mutation avec revalidation par tag (granulaire)
 * 
 * @example
 * await mutateWithTag('nouvelle valeur');
 * router.refresh(); // Côté client
 */
export async function mutateWithTag(inputValue: string) {
  if (!inputValue || inputValue.trim() === '') {
    throw new Error('La valeur ne peut pas être vide');
  }

  await mutateCache({
    serviceKey: 'ssrdemo-simple',
    value: inputValue.trim(),
    tags: ['ssrdemo-simple'],
  });
}

/**
 * Mutation simple
 * 
 * @example
 * await mutateSample('nouvelle valeur');
 */
export async function mutateSample(inputValue: string) {
  if (!inputValue || inputValue.trim() === '') {
    throw new Error('La valeur ne peut pas être vide');
  }

  await mutateCache({
    serviceKey: 'ssrdemo-simple',
    value: inputValue.trim(),
    tags: ['ssrdemo-simple'],
  });
}

/**
 * Invalider et revalider le cache
 * 
 * @example
 * await resetCache();
 * router.refresh(); // Côté client
 */
export async function resetCache() {
  await revalidateCache({
    serviceKey: 'ssrdemo-simple',
    tags: ['ssrdemo-simple'],
  });
}

/**
 * Revalider uniquement (sans invalider)
 * 
 * @example
 * await refreshData();
 */
export async function refreshData() {
  await revalidateCache({
    tags: ['ssrdemo-simple'],
  });
}
