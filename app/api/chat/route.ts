import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic();

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
