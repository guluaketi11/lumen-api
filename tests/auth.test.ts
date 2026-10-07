import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, resetDatabase } from './setup';

describe('auth', () => {
  beforeEach(resetDatabase);

  it('registers a new editor and returns a token without the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Keti', email: 'Keti@Example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({ name: 'Keti', email: 'keti@example.com', role: 'editor' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects a duplicate email', async () => {
    const body = { name: 'Keti', email: 'keti@example.com', password: 'password123' };
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('email_taken');
  });

  it('returns field-level validation errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'K', email: 'nope', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(['name', 'email', 'password']);
  });

  it('logs in with the demo account and rejects a wrong password', async () => {
    const ok = await request(app).post('/api/auth/login').send({ email: 'demo@lumen.dev', password: 'demo1234' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'demo@lumen.dev', password: 'nope' });

    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('admin');
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('invalid_credentials');
  });

  it('returns the current user only with a valid token', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: 'demo@lumen.dev', password: 'demo1234' });
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${login.body.token}`);
    const anonymous = await request(app).get('/api/auth/me');
    const forged = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('demo@lumen.dev');
    expect(anonymous.status).toBe(401);
    expect(forged.status).toBe(401);
  });
});
