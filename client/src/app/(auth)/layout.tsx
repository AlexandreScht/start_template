import { type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--color-background-v1)] to-[var(--color-background-v3)] p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-background-v2)] p-8 shadow-2xl ring-1 ring-black/5 dark:bg-[var(--color-background-v4)]">
        {children}
      </div>
    </div>
  );
}
