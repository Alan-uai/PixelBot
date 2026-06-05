import { OpenRouter } from '@openrouter/sdk';
import { tool } from '@openrouter/sdk/lib/tool.js';
import { z } from 'zod';
import { getGameData } from '../supabase/index.js';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const FALLBACK_CHAIN = (process.env.FALLBACK_CHAIN ||
  'openai/gpt-4o-mini,minimax/minimax-m2.5:free,google/gemini-flash-1.5,anthropic/claude-3.5-haiku'
).split(',').map(m => m.trim()).filter(Boolean);

export const GENERIC_ERROR_MESSAGE = 'Desculpe não pude te responder, porém acredito que @suporte pode te ajudar';

async function withFallback(fn, preferredModel) {
  const modelsToTry = preferredModel
    ? [preferredModel, ...FALLBACK_CHAIN.filter(m => m !== preferredModel)]
    : [...FALLBACK_CHAIN];

  let lastError;
  for (const model of modelsToTry) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed, trying next fallback:`, error);
    }
  }
  throw new Error(GENERIC_ERROR_MESSAGE);
}

function createGetGameDataTool(tenantId) {
  return tool({
    name: 'getGameData',
    description: 'Get information about game content like weapons, armors, rings, potions, upgrades, enemies, bosses, worlds, or codes.',
    inputSchema: z.object({
      table: z.string().describe('The game table to search (e.g., "weapons", "armors", "rings", "potions", "upgrades", "enemies", "bosses", "worlds", "codes").'),
      search: z.string().optional().describe('Optional search term to filter by name or description. Be flexible with partial matches.'),
    }),
    outputSchema: z.unknown(),
    execute: async (params) => {
      return await getGameData(params.table, params.search, tenantId);
    }
  });
}

export async function chat({ messages, model, temperature = 0.7, maxTokens }) {
  return withFallback(async (currentModel) => {
    const result = await openRouter.chat.send({
      chatRequest: {
        messages,
        model: currentModel,
        temperature,
        maxTokens,
      }
    });
    return result.choices[0].message.content;
  }, model);
}

export async function chatStructured({ messages, model, temperature = 0.7 }) {
  return withFallback(async (currentModel) => {
    const result = await openRouter.chat.send({
      chatRequest: {
        messages,
        model: currentModel,
        temperature,
        responseFormat: { type: 'json_object' },
      }
    });
    return result.choices[0].message.content;
  }, model);
}

export async function chatWithTools({
  messages,
  model,
  temperature = 0.7,
  tenantId,
  maxToolRounds = 5,
}) {
  const tools = tenantId ? [createGetGameDataTool(tenantId)] : [];

  return withFallback(async (currentModel) => {
    const result = await openRouter.callModel({
      chatRequest: {
        messages,
        model: currentModel,
        temperature,
      },
      tools: tools,
      maxToolRounds,
    });
    return result;
  }, model);
}

export { openRouter };
