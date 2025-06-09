'use client';

import { useService } from '@/hooks/useService';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Dashboard() {
  const [canFetch, setCanFetch] = useState<boolean>(true);
  const dataLoggedRef = useRef<boolean>(false);
  const { data, error } = useService(v => v.simple(undefined, 'customKey'), { isDisabled: canFetch });

  useEffect(() => {
    if (data && !dataLoggedRef.current) {
      console.log('Data received:', data);
      dataLoggedRef.current = true;
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.log('Error received:', error);
    }
  }, [error]);

  return (
    <div className="flex flex-col gap-20">
      <button
        className="w-fit cursor-pointer rounded bg-red-500 p-2 text-white"
        onClick={() => {
          // Réinitialiser le flag de log avant de déclencher une nouvelle requête
          dataLoggedRef.current = false;
          setCanFetch(false);
        }}
      >
        Fetch data
      </button>
      {data && <p className="font-medium text-green-500">Success</p>}
      {error && <p className="font-medium text-red-500">Error</p>}
    </div>
  );
}
