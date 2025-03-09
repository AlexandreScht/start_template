import Config from '@/server/config';
const start = async () => {
  const app = new Config();
  await app.initialize();
  app.listen();
};
start();
