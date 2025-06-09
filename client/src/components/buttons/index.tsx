'use client';

import { useListenerStore, useStore } from '@/hooks/providers/StoreProvider';
import { Button } from '@heroui/react';

export default function StartGame() {
  const { name } = useStore(v => v.pseudo);
  const { trigger } = useListenerStore();

  const handleClick = () => trigger('create_game');

  return (
    <Button
      onPress={handleClick}
      className="bg-secondary hover:bg-secondary-v11 mt-auto rounded-lg px-6 py-3 text-white"
    >
      Lancer le jeu
    </Button>
  );
}
