'use client';

import { useStore } from '@/hooks/StoreProvider';

export default function AuthModal() {
  const { name, setName } = useStore(v => v.pseudo);

  return <div></div>;
}
