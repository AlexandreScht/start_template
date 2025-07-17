import type oAuthMethods from '@/config/oauth';
import { type ReactNode } from 'react';
import { type IconType } from 'react-icons/lib';

declare namespace AuthTypes {
  interface oAuthProviders {
    method: keyof typeof oAuthMethods;
    className?: string;
    content?: ReactNode | IconType;
  }
}
