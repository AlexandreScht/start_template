'use client';

import { serviceOptions } from '@/config/services';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import React, { useState } from 'react';

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() =>
    new QueryClient(serviceOptions)
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
