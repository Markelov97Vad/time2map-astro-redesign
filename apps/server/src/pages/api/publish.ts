import type { APIRoute } from 'astro';
import { publish } from '../../lib/publish';

export const prerender = false;

// Auth is enforced in middleware.ts (Basic Auth on /api/publish).
export const POST: APIRoute = async () => {
  const result = await publish();
  return new Response(JSON.stringify(result, null, 2), {
    status: result.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
};
