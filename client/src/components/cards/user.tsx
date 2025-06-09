'use client';

import { useListenerStore, useStore } from '@/hooks/providers/StoreProvider';
import { Input } from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { LuUser } from 'react-icons/lu';
import { MdOutlineNewLabel } from 'react-icons/md';

export default function UserModal() {
  const { name, setName } = useStore(v => v.pseudo);
  const [value, setValue] = useState<string>('');
  const { observer } = useListenerStore();

  useEffect(() => {
    const unsubscribe = observer('create_game', payload => {
      console.log('Le bouton lancer la game a été cliqué !!!!', payload);
    });

    return unsubscribe;
  }, [observer]);

  const handleChange = useCallback((v: string) => setValue(v), []);
  const handleConfirm = useCallback(() => setName(value), [setName, value]);

  if (!name) {
    return (
      <div className="relative">
        <Input
          variant="bordered"
          size="md"
          radius="sm"
          startContent={<LuUser className="text-foreground-v10" />}
          placeholder="Entrez votre pseudo"
          value={value}
          onValueChange={handleChange}
          classNames={{
            input: 'h-8 text-foreground placeholder:text-foreground-v10 pr-6',
            inputWrapper:
              'data-[hover=true]:bg-asset-v2 !border-asset-v7 focus-within:!border-asset-v7 data-[hover=true]:!border-asset-v8',
            innerWrapper: 'bg-transparent',
          }}
        />
        <AnimatePresence>
          {!!value && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              onClick={handleConfirm}
            >
              <MdOutlineNewLabel className="text-foreground h-5 w-5 transition-all hover:scale-110" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  return (
    <div className="mr-5 flex h-full items-center gap-3">
      <h2 className="text-md m-0 font-medium">{name}</h2>
      <div className="bg-asset-v6 border-asset border-1 flex items-center justify-center rounded-full p-2">
        <LuUser className="text-foreground-v10 h-5 w-5" />
      </div>
    </div>
  );
}
