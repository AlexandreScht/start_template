'use client';

import { useMutation, useService } from '@/hooks/ServiceProvider';
import { useStore } from '@/hooks/StoreProvider';
import laggy from '@/middlewares/laggy';
import { type Middleware } from 'swr';

export default function CounterIncrement() {
  // const [allowed, setAllowed] = useState<boolean>(false);

  // useService(v => v.account({ id: 5 }));

  useMutation(v => [v.account(p => [p, "customKey"] { isValid: true, ...mutatorObject })], {merge: "combined" | "none" | "force", ...mutatorObject});

  return (
    <div>
      {/* <p>isLoading : {loading}</p>
      <button onClick={handleFetchData}>fetch data</button>
      <p>data : {values}</p> */}
    </div>
  );
}
