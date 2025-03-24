'use client';

import { useService } from '@/hooks/useService';

export default function CounterIncrement() {
  // usePrefetch(v => v.account({ id: 5 }));
  const { data } = useService(v => v.account({ id: 5 }));

  // useMutation(v => [v.account({ revalidate: true })]);
  // useMutation(v => [v.account(v => [`prefix:${v}:suffix-maValue`])]);
  // useMutation(v => [v.account(v => [{ ...v, id: 5 }, 'customeKey'], { revalidate: true })], { optimisticData: true });
  return (
    <div>
      {/* <p>isLoading : {loading}</p>
      <button onClick={handleFetchData}>fetch data</button>
      <p>data : {values}</p> */}
    </div>
  );
}
