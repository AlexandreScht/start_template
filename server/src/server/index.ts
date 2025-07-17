import Server from '@/server/app';
const start = async () => {
  const app = new Server();
  app.listen();
  await app.initialize();
};
start();
