'use client';

import { Button, cn, Input } from '@heroui/react';
import copy from 'clipboard-copy';
import { useCallback, useState } from 'react';
import { FaCopy } from 'react-icons/fa';
import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';
import { v4 as uuid } from 'uuid';

export default function GenerateGameId({ className }: { className?: string }) {
  const [gameId, setGameId] = useState<string>('');

  const handleClick = useCallback(() => setGameId(uuid().split('-')[0]), []);

  const handleCopy = useCallback(async () => {
    if (!gameId) return;
    try {
      await copy(gameId);
      Toastify({
        text: 'Id copié avec succès ✓ ',
        duration: 3000,
        gravity: 'bottom',
        position: 'right',
        close: false,
        style: {
          background: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-success-v8) 100%)',
          color: '#ffffff',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '500',
          border: '1px solid var(--color-success-v7)',
          boxShadow: '0 4px 12px var(--color-asset-v3)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s ease-in-out',
          width: 'auto',
          justifyContent: 'flex-start',
        },
      }).showToast();
    } catch (err) {
      Toastify({
        text: "Erreur lors de l'envoi du mail",
        duration: 3000,
        gravity: 'bottom',
        position: 'right',
        close: false,
        style: {
          background: 'linear-gradient(135deg, var(--color-danger) 0%, var(--color-danger-v8) 100%)',
          color: '#fff',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '500',
          border: '1px solid var(--color-danger-v7)',
          boxShadow: '0 3px 6px var(--color-asset-v3)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s ease-in-out',
          width: 'auto',
          justifyContent: 'flex-start',
        },
      }).showToast();
      console.error('Erreur lors de la copie:', err);
    }
  }, [gameId]);

  return (
    <div className={cn('flex gap-4', className)}>
      <Input
        value={gameId}
        placeholder="Identifiant de la partie"
        endContent={
          <Button
            radius="sm"
            className="text-foreground-v8 hover:text-foreground -mr-3 aspect-square h-full min-w-0 cursor-pointer rounded-l-sm p-0"
            onPress={handleCopy}
          >
            <FaCopy className="h-full w-full p-2 transition-all duration-100 hover:scale-110" />
          </Button>
        }
        disabled
        classNames={{
          input: 'cursor-not-allowed',
          innerWrapper: 'cursor-not-allowed',
          inputWrapper:
            'border-1 data-[hover=true]:bg-asset-v2 !border-asset-v7 focus-within:!border-asset-v7 data-[hover=true]:!border-asset-v8',
        }}
        radius="sm"
        className="flex-1"
      />

      <Button onPress={handleClick} className="bg-primary-v8 hover:bg-primary text-md rounded-lg px-4 py-2 text-white">
        Générer
      </Button>
    </div>
  );
}
