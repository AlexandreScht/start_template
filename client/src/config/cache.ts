import { QueryClientConfig } from '@tanstack/react-query';

// ===== Configuration SSR (Server-Side) =====
export const ssrCacheConfig = {
  DEFAULT_TTL: 60 * 3, // 3 min (en secondes)
  PERSIST_TTL: 24 * 60 * 60 * 31, // 1 mois (en secondes)
  CHECK_PERIOD: 60 * 3, // 3 min (en secondes)
};

// ===== Configuration Client (React Query) =====
export const clientCacheConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min - Données considérées fraîches
      gcTime: 5 * 60 * 1000, // 5 min - Garbage collection
      refetchOnWindowFocus: false, // Pas de refetch au focus
    },
  },
} satisfies QueryClientConfig;


const cacheConfig = {
  DEFAULT_TIME_LIFE: ssrCacheConfig.DEFAULT_TTL,
  PERSIST_TIME_LIFE: ssrCacheConfig.PERSIST_TTL,
  CHECK_PERIOD: ssrCacheConfig.CHECK_PERIOD,
};

export default cacheConfig;
