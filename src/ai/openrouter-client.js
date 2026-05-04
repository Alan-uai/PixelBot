// PixelBot/src/ai/openrouter-client.js
import { OpenRouter } from '@openrouter/sdk';
import { tool } from '@openrouter/sdk';
import { z } from 'zod';
import { getGameData, getUpdateLog } from '../supabase/index.js';

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

// Definição das tools usando Zod schemas
const getGameDataTool = tool({
  name: 'getGameData',
  description: 'Get information about game content like powers, NPCs, pets, accessories, or dungeons from a specific world.',
  inputSchema: z.object({
    worldName: z.string().describe('The name of the world to search in (e.g., "World 1", "Windmill Island").'),
    category: z.string().describe('The category of information to get (e.g., "powers", "npcs", "pets", "accessories", "dungeons", "missions").'),
    itemName: z.string().optional().describe('The specific name of the item to look for (e.g., "Grand Elder Power"). Be flexible; if an exact match fails, try a partial name.'),
  }),
  outputSchema: z.unknown(),
  execute: async (params) => {
    return await getGameData(params.worldName, params.category, params.itemName);
  }
});

const getUpdateLogTool = tool({
  name: 'getUpdateLog',
  description: 'Gets the latest game update log. Use this when the user asks "what is the new update?", "what changed?", "update log", etc.',
  inputSchema: z.object({}),
  outputSchema: z.unknown(),
  execute: async () => {
    return await getUpdateLog();
  }
});

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
  tools = [getGameDataTool, getUpdateLogTool],
  maxToolRounds = 5,
}) {
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

export { openRouter, getGameDataTool, getUpdateLogTool };
