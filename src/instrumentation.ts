export async function register() {
  // Only load Sentry in production — importing it in dev compiles ~1000 extra
  // modules on every server start and slows route navigation significantly.
  if (process.env.NODE_ENV !== 'production') return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
