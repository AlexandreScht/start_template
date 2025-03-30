import serverRevalidate from '@/libs/serverRevalidate';

export default async function ComponentName() {
  serverRevalidate(v => [v.testParams({ id: 5 }, () => ({ id: 6 }))]);
  return <div></div>;
}
