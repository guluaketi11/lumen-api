export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: '7d' as const,
  databaseUrl: process.env.DATABASE_URL ?? '',
  sqliteStorage: process.env.NODE_ENV === 'test' ? ':memory:' : 'lumen.sqlite',
  adminEmail: process.env.ADMIN_EMAIL ?? 'demo@lumen.dev',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'demo1234',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
