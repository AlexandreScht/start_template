// import serverService from '@/libs/serverService';

export default async function Home() {
  // const { data, error } = await serverService(v => v.testParams({ id: 5 }));

  // console.log({ data, error });

  return <main className="flex min-h-screen w-full bg-primary flex-col items-center justify-between p-24">{/* <h1>{data?.user}</h1> */}</main>;
}
