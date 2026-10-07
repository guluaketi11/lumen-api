import { config } from './config';
import { sequelize } from './db';
import { createApp } from './app';
import { seed } from './seed';

const start = async () => {
  await sequelize.sync();
  await seed();
  createApp().listen(config.port, () => {
    console.log(`Lumen API running on http://localhost:${config.port} (docs at /docs)`);
  });
};

start().catch((err) => {
  console.error('Failed to start', err);
  process.exit(1);
});
