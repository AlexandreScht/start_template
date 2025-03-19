import CounterIncrement from '@/components/counter';
import useServerService from '@/libs/useServerService';

export default function Home() {
  // useServerService(s => s.account({ id: 5 }), { cache: { ""}});
  return (
    <main className="flex min-h-screen w-full bg-red-500 flex-col items-center justify-between p-24">
      {/* <p>Initial counter {score}</p> */}
      <h1>CC</h1>
      <CounterIncrement />
    </main>
  );
}
