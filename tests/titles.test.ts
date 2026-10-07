import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, loginAsAdmin, registerEditor, resetDatabase } from './setup';

const newTitle = {
  title: 'Wing It!',
  year: 2023,
  genre: 'Comedy',
  durationMinutes: 4,
  description: 'A short open movie made with Blender.',
  streamUrl: 'https://example.com/wing-it/playlist.m3u8',
};

describe('titles', () => {
  beforeEach(resetDatabase);

  it('lists titles sorted by views with pagination meta', async () => {
    const res = await request(app).get('/api/titles?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toEqual({ page: 1, limit: 5, total: 14, pages: 3 });
    const views = res.body.data.map((t: { views: number }) => t.views);
    expect(views).toEqual([...views].sort((a, b) => b - a));
  });

  it('filters by genre and searches title and description', async () => {
    const byGenre = await request(app).get('/api/titles?genre=Comedy');
    const bySearch = await request(app).get('/api/titles?search=dragon');

    expect(byGenre.body.data.every((t: { genre: string }) => t.genre === 'Comedy')).toBe(true);
    expect(bySearch.body.data.map((t: { title: string }) => t.title)).toEqual(['Sintel']);
  });

  it('rejects an invalid query', async () => {
    const res = await request(app).get('/api/titles?sort=price&limit=500');

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toEqual(['sort', 'limit']);
  });

  it('returns 404 for a missing title', async () => {
    const res = await request(app).get('/api/titles/9999');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('requires a token to create a title', async () => {
    const res = await request(app).post('/api/titles').send(newTitle);
    expect(res.status).toBe(401);
  });

  it('creates a title with a generated slug and validates the stream URL', async () => {
    const token = await registerEditor();
    const created = await request(app).post('/api/titles').set('Authorization', `Bearer ${token}`).send(newTitle);
    const invalid = await request(app)
      .post('/api/titles')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newTitle, streamUrl: 'https://example.com/video.mp4' });

    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ slug: 'wing-it', status: 'draft', views: 0 });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details[0]).toEqual({ field: 'streamUrl', message: 'Must be an HLS (.m3u8) URL' });
  });

  it('updates a title', async () => {
    const token = await registerEditor();
    const res = await request(app)
      .patch('/api/titles/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'archived' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('archived');
  });

  it('only lets admins delete titles', async () => {
    const editor = await registerEditor();
    const admin = await loginAsAdmin();

    const forbidden = await request(app).delete('/api/titles/1').set('Authorization', `Bearer ${editor}`);
    const deleted = await request(app).delete('/api/titles/1').set('Authorization', `Bearer ${admin}`);
    const gone = await request(app).get('/api/titles/1');

    expect(forbidden.status).toBe(403);
    expect(deleted.status).toBe(204);
    expect(gone.status).toBe(404);
  });
});

describe('stats', () => {
  beforeEach(resetDatabase);

  it('aggregates views by genre and titles by status', async () => {
    const res = await request(app).get('/api/stats');
    const { data } = res.body;

    expect(res.status).toBe(200);
    expect(data.titles).toBe(14);
    expect(data.views).toBe(data.byGenre.reduce((sum: number, g: { views: number }) => sum + g.views, 0));
    expect(data.byStatus).toEqual(
      expect.arrayContaining([
        { status: 'published', titles: 11 },
        { status: 'draft', titles: 2 },
        { status: 'archived', titles: 1 },
      ]),
    );
  });
});

describe('errors', () => {
  it('returns JSON for unknown routes and malformed bodies', async () => {
    const missing = await request(app).get('/api/nope');
    const malformed = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('invalid_json');
  });
});
