import Server from '@/server/app';
const start = async () => {
  const app = new Server();
  await app.initialize();
  app.listen();
};
start();
