// PixelBot/src/ai/openrouter-client.js
import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function chat({ messages, model = 'openai/gpt-4o-mini', temperature = 0.7, maxTokens }) {
  const result = await openRouter.chat.send({
    messages,
    model,
    temperature,
    max_tokens: maxTokens,
  });

  return result.choices[0].message.content;
}

export async function chatStructured({ messages, model = 'openai/gpt-4o-mini', temperature = 0.7 }) {
  const result = await openRouter.chat.send({
    messages,
    model,
    temperature,
    response_format: { type: 'json_object' },
  });

  return result.choices[0].message.content;
}

export { openRouter };
