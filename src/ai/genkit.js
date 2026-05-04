// src/ai/genkit.js
import { genkit } from 'genkit';
import { openrouter } from '@genkit-ai/openrouter';
import 'dotenv/config';

export const ai = genkit({
  plugins: [
    openrouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    }),
  ],
  model: 'minimax/minimax-m2.5:free',
});
