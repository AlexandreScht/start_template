import CounterIncrement from '@/components/counter';
import serverRevalidate from '@/libs/serverRevalidate';
import serverService from '@/libs/serverService';

export default async function Home() {
  // const { data, error } = await serverService(v => v.account({ id: 5 }));
  // console.log({ data, error });

  // serverRevalidate(v => v.account({ id: 5 }, () => ({ id: 6 })));

  return (
    <main className="flex min-h-screen w-full bg-red-500 flex-col items-center justify-between p-24">
      {/* <p>Initial counter {score}</p> */}
      <h1>CC</h1>
      {/* <CounterIncrement /> */}
    </main>
  );
}
