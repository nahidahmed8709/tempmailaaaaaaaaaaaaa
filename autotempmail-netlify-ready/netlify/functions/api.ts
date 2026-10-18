import serverless from 'serverless-http';
import { app } from '../../server.js';

// Netlify redirects /api/* to this function. Preserve the original /api/... route
// when forwarding the request to Express.
const handler = serverless(app, {
  request: (request: any, event: any) => {
    const originalPath = event?.rawUrl ? new URL(event.rawUrl).pathname : '';
    if (originalPath.startsWith('/api/')) request.url = originalPath + (event.rawUrl && new URL(event.rawUrl).search || '');
  },
});

export { handler };
