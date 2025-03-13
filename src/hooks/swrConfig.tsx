// app/ClientProviders.jsx
'use client';

import React from 'react';
import { SWRConfig } from 'swr';

export default function SwrProviders({ children, initialCache }: { children: React.ReactNode; initialCache: Map<string, any> }) {
  return <SWRConfig value={{ provider: () => initialCache }}>{children}</SWRConfig>;
}
