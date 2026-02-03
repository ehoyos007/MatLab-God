import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic();

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window

// In-memory store for rate limiting (resets on cold start)
const rateLimitStore = new Map<string, { timestamps: number[] }>();

function getClientIP(req: NextRequest): string {
  // Try various headers for client IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let record = rateLimitStore.get(ip);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(ip, record);
  }

  // Remove timestamps outside the window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  const remaining = RATE_LIMIT_MAX_REQUESTS - record.timestamps.length;
  const oldestInWindow = record.timestamps[0];
  const resetIn = oldestInWindow ? Math.ceil((oldestInWindow + RATE_LIMIT_WINDOW_MS - now) / 1000) : 0;

  if (record.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn };
  }

  // Add current request timestamp
  record.timestamps.push(now);
  return { allowed: true, remaining: remaining - 1, resetIn: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) };
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  for (const [ip, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => t > windowStart);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

interface ChallengeContext {
  title: string;
  description: string;
  type: string;
  code: string;
  module: number;
}

function buildSystemPrompt(ctx?: ChallengeContext): string {
  if (ctx) {
    return `You are a MATLAB tutor inside a learning game called MATLAB-GOD. The student is working on a challenge. Guide them without giving the answer directly — use Socratic questioning, give hints, and help them reason through the problem.

Current challenge:
- Title: ${ctx.title}
- Type: ${ctx.type}
- Module: ${ctx.module}
- Description: ${ctx.description}
- Code:
\`\`\`matlab
${ctx.code}
\`\`\`

Be concise. Use MATLAB code examples when helpful. Never give the direct solution.`;
  }

  return `You are a MATLAB expert tutor inside a learning game called MATLAB-GOD. Help the student learn MATLAB concepts. Be concise, use code examples when helpful. Format code blocks with \`\`\`matlab.`;
}

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIP = getClientIP(req);
  const { allowed, remaining, resetIn } = checkRateLimit(clientIP);

  if (!allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait before sending another message.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(resetIn),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(resetIn),
        },
      }
    );
  }

  try {
    const { messages, challengeContext } = await req.json();

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(challengeContext),
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Chat API error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
