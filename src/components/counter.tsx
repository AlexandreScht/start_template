'use client';

import { useService } from '@/hooks/ServiceProvider';
import { useStore } from '@/hooks/StoreProvider';
import laggy from '@/middlewares/laggy';
import { type Middleware } from 'swr';

export default function CounterIncrement() {
  // const [allowed, setAllowed] = useState<boolean>(false);

  useService(v => v.account({ id: 5 }));

  // reval idate([account], { revalidate: false });

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
