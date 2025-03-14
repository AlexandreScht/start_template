'use client';

import { useService } from '@/hooks/ServiceProvider';
import { useStore } from '@/hooks/StoreProvider';
import useClientService from '@/libs/useClientService';
import useClientSWR from '@/libs/useClientService';
import { useCallback } from 'react';
// import { useAppStore } from '@/hooks/StoreProvider';

// 4. La signature de revalidate

export default function CounterIncrement() {
  // const [allowed, setAllowed] = useState<boolean>(false);
  const {
    services: { account },
    revalidate,
  } = useService();
  // revalidate([account({ id: 1 })]);
  useClientService(account, true, { ""});

  // revalidate([account], { revalidate: false });

  // console.log(account(v => [v, { revalidate: true }]));

  // revalidate([account(v => [v])]);
  // revalidate([account, { service: user, cache: (v) => v, options: ...mutateOptions }, score], { ...mutateOptions)])

  // swc(account(1), { cache: (v) => v, revalidate: true, allowService: false });
  return (
    <div>
      {/* <p>isLoading : {loading}</p>
      <button onClick={handleFetchData}>fetch data</button>
      <p>data : {values}</p> */}
    </div>
  );
}
