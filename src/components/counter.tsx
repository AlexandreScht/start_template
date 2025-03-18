'use client';

import { useMutation, useService } from '@/hooks/ServiceProvider';
import { useStore } from '@/hooks/StoreProvider';
import laggy from '@/middlewares/laggy';
import { type Middleware } from 'swr';

export default function CounterIncrement() {
  // const [allowed, setAllowed] = useState<boolean>(false);

  const { data, error, isLagging } = useService(v => v.account({ id: 5 }), { cache: { use: [laggy] } });
  // TODO => type cacheOption pas bien mis, les keys ne me sont pas preésenter par TS dans l'exemple ci dessous:
  useMutation(v => [v.account({ isValid: true, "" })]);
  // useMutation(v => [v.account({ id: 5 })]);
  return (
    <div>
      {/* <p>isLoading : {loading}</p>
      <button onClick={handleFetchData}>fetch data</button>
      <p>data : {values}</p> */}
    </div>
  );
}
