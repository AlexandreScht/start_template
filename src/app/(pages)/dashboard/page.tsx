import serverRevalidate from '@/libs/serverRevalidate';

export default async function ComponentName() {
  serverRevalidate(v => [v.testParams({ id: 5 }, { id: 8 })]);
  return <div>Dashboard</div>;
}
