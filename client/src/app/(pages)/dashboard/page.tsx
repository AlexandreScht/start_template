import serverRevalidate from '@/libs/serverRevalidate';

export default async function Dashboard() {
  serverRevalidate(v => [v.testParams({ id: 5 }, { user: 'chocolat' })]);
  return <div>Dashboard</div>;
}
