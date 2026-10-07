import request from 'supertest';
import { createApp } from '../src/app';
import { sequelize } from '../src/db';
import { seed } from '../src/seed';

export const app = createApp();

export const resetDatabase = async () => {
  await sequelize.sync({ force: true });
  await seed();
};

export const loginAsAdmin = async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'demo@lumen.dev', password: 'demo1234' });
  return res.body.token as string;
};

export const registerEditor = async (email = 'editor@example.com') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Editor', email, password: 'password123' });
  return res.body.token as string;
};
