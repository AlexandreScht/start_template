'use client';

import { useMutation, useService } from '@/hooks/ServiceProvider';
import { useStore } from '@/hooks/StoreProvider';
import laggy from '@/middlewares/laggy';
import { type Middleware } from 'swr';

export default function CounterIncrement() {
  // const [allowed, setAllowed] = useState<boolean>(false);

  const { data, error, isLagging } = useService(v => v.account({ id: 5 }), { cache: { use: [laggy] } });
  useMutation(v => [v.account(v => [v, 'key'], { isValid: true })]);
  // useMutation(v => [v.account({ id: 5 })]);
  return (
    <div>
      {/* <p>isLoading : {loading}</p>
      <button onClick={handleFetchData}>fetch data</button>
      <p>data : {values}</p> */}
    </div>
  );
}
