import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

const genres = ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror Comedy', 'Sci-Fi', 'Documentary'] as const;

export const titleSchema = z.object({
  title: z.string().trim().min(1).max(160),
  year: z.number().int().min(1888).max(new Date().getFullYear() + 2),
  genre: z.enum(genres),
  durationMinutes: z.number().int().min(1).max(600),
  description: z.string().trim().min(10).max(2000),
  streamUrl: z.url().refine((url) => url.endsWith('.m3u8'), 'Must be an HLS (.m3u8) URL'),
  status: z.enum(['published', 'draft', 'archived']).default('draft'),
});

export const titleUpdateSchema = titleSchema.partial();

export const titleQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  genre: z.enum(genres).optional(),
  status: z.enum(['published', 'draft', 'archived']).optional(),
  sort: z.enum(['title', '-title', 'year', '-year', 'views', '-views', 'createdAt', '-createdAt']).default('-views'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
