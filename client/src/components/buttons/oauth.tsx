'use client';

import oAuthMethods from '@/config/oauth';
import { type AuthTypes } from '@/interfaces/auth';
import { Button, cn } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function OAuth({ providerList }: { providerList: AuthTypes.oAuthProviders[] }) {
  const router = useRouter();

  const handleClick = useCallback(
    (provider: keyof typeof oAuthMethods) => {
      const uriFetcher = oAuthMethods[provider];
      router.replace(uriFetcher);
    },
    [router],
  );

  return (
    <>
      {providerList.map(provider => {
        return (
          <Button
            key={provider.method}
            onPress={() => void handleClick(provider.method)}
            className={cn(
              '!text-p1 bg-content text-secondary shadow-border maw-w-full hover:border-gradient relative h-fit min-h-0 w-full rounded-lg md:mt-5 md:mb-4 md:py-2.5 lg:mt-6 lg:mb-5 xl:mt-8 xl:mb-6',
              provider?.className,
            )}
          >
            <>{provider.content ? provider.content : <span className="text-foreground">{provider.method}</span>}</>
          </Button>
        );
      })}
    </>
  );
}
