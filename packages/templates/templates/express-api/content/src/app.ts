import express, { type ErrorRequestHandler, type RequestHandler } from 'express';

import { env, isProduction } from './env.js';
import { HttpError } from './lib/http.js';
import { healthRouter } from './routes/health.js';
import { itemsRouter } from './routes/items.js';

/** Allows the configured origin only; `*` allows any origin. */
const corsMiddleware: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  const allowed = env.CORS_ORIGIN;

  if (origin && (allowed === '*' || origin === allowed)) {
    res.setHeader('Access-Control-Allow-Origin', allowed === '*' ? '*' : origin);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  next();
};

const requestLogger: RequestHandler = (req, res, next) => {
  if (isProduction) {
    next();
    return;
  }
  const startedAt = performance.now();
  res.on('finish', () => {
    const duration = (performance.now() - startedAt).toFixed(1);
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
};

const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
};

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  if (!isProduction) {
    console.error(error);
  }

  res.status(500).json({
    error: {
      message: isProduction || !(error instanceof Error) ? 'Internal server error' : error.message,
    },
  });
};

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(corsMiddleware);
  app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.json({
      name: '{{packageName}}',
      endpoints: { health: '/api/health', items: '/api/items' },
    });
  });

  app.use('/api/health', healthRouter);
  app.use('/api/items', itemsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Route not found' } });
  });
  app.use(errorHandler);

  return app;
}
