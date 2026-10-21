import { createApp } from './app.js';
import { env } from './env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV} | CORS origin: ${env.CORS_ORIGIN}`);
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received, closing the server`);

  server.close((error) => {
    if (error) {
      console.error('Failed to close cleanly:', error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
