import CounterIncrement from '@/components/counter';
import useServerService from '@/libs/useServerService';

export default function Home() {
  useServerService(s => s.account({ id: 5 }), { headers: { 'Set-Cookies': [{ name: 'foo', value: { d: 1 } }] } });
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* <p>Initial counter {score}</p> */}
      <CounterIncrement />
    </main>
  );
}
