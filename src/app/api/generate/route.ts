import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from '@/lib/system-prompt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questions, context, apiKey, feedbackInstruction, userPreference, existingNotes } = body;

    if (!apiKey) {
      return Response.json({ error: 'API key is required' }, { status: 400 });
    }
    if (!questions) {
      return Response.json({ error: 'Questions are required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    let userMessage = '';

    if (userPreference) {
      userMessage += `## User Preference / Instructions\n\n${userPreference}\n\n---\n\n`;
    }

    if (existingNotes) {
      userMessage += `## Already Generated (DO NOT regenerate these)\n\nThe following questions have already been answered. Do NOT repeat them. Only generate answers for the questions not yet covered:\n\n${existingNotes}\n\n---\n\n`;
    }

    if (context) {
      userMessage += `## Course Material / Context\n\n${context}\n\n---\n\n`;
    }

    userMessage += `## Questions to Answer\n\n${questions}`;

    if (feedbackInstruction) {
      userMessage += `\n\n## Instruction\n\n${feedbackInstruction}`;
    }

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 16000,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: userMessage,
              },
            ],
          });

          for await (const chunk of anthropicStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                new TextEncoder().encode(chunk.delta.text)
              );
            }
          }

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            new TextEncoder().encode(`\n<div class="exam-tips" style="border-left-color: #dc2626;"><p style="color: #dc2626;">⚠️ Error generating notes: ${errorMessage}</p></div>`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
