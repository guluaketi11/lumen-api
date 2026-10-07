import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { openapi } from './openapi';
import { authRouter } from './routes/auth';
import { statsRouter } from './routes/stats';
import { titlesRouter } from './routes/titles';
import { errorHandler, notFoundHandler } from './middleware/errors';

export const createApp = () => {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) => res.redirect('/docs'));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'Lumen API docs' }));
  app.get('/openapi.json', (_req, res) => res.json(openapi));

  app.use('/api/auth', authRouter);
  app.use('/api/titles', titlesRouter);
  app.use('/api/stats', statsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
