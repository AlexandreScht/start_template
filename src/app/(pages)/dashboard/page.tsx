import serverRevalidate from '@/libs/serverRevalidate';

export default async function ComponentName() {
  serverRevalidate(v => [v.testParams]);
  return <div></div>;
}
