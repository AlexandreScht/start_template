import Redirecting from '@/components/redirest';
import serverService from '@/libs/serverService';

export default async function Home() {
  const { data, error } = await serverService(v => v.testParams({ id: 5 }));
  console.log({ data, error });

  return (
    <main className="flex min-h-screen w-full bg-red-500 flex-col items-center justify-between p-24">
      <Redirecting />
    </main>
  );
}
