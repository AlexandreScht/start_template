'use client';

import { useMutation, useService } from '@/hooks/ServiceProvider';
import { useStore } from '@/hooks/StoreProvider';
import laggy from '@/middlewares/laggy';
import { useCallback } from 'react';
import { type Middleware } from 'swr';

export default function CounterIncrement() {
  // const [allowed, setAllowed] = useState<boolean>(false);
  console.log('here');
  const { data } = useService(v => v.account(, 'key'), { cache: {}, header: {} });
  console.log(data);

  // // TODO => type cacheOption pas bien mis, les keys ne me sont pas preésenter par TS dans l'exemple ci dessous:
  // useMutation(v => [v.account]);
  // useMutation(v => [v.account({ isValid: true })]);
  // useMutation(v => [v.account(v => [{ ...v, id: 5 }, 'customeKey'], { revalidate: true })], { optimisticData: true });
  return (
    <div>
      {/* <p>isLoading : {loading}</p>
      <button onClick={handleFetchData}>fetch data</button>
      <p>data : {values}</p> */}
    </div>
  );
}
