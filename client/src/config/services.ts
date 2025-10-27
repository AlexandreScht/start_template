import { QueryClientConfig } from "@tanstack/react-query";

export const serviceOptions = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // 1 min - Données considérées fraîches
      gcTime: 5 * 60 * 1000,      // 5 min - Garbage collection
      refetchOnWindowFocus: false, // Pas de refetch au focus
    },
  },
} satisfies QueryClientConfig