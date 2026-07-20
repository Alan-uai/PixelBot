// PixelBot/src/ai/flows/generate-solution.js
import { chatStructured } from '../openrouter-client.js';
import { z } from 'zod';
import { officialLanguages } from '../official-languages.js';
import { funLanguages } from '../fun-languages.js';
import { personas } from '../personas.js';
import { responseStyles } from '../response-styles.js';
import { emojiStyles } from '../emoji-styles.js';

// Unifica os idiomas em um único objeto para facilitar a busca
const allLanguages = { ...officialLanguages, ...funLanguages };

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const GenerateSolutionInputSchema = z.object({
  problemDescription: z.string().describe('A description of the player is encountering in Anime Eternal.'),
  imageDataUri: z.string().optional().describe("A photo related to the problem, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  wikiContext: z.string().describe('A compilation of all wiki articles to be used as a knowledge base.'),
  userProfileContext: z.string().optional().describe("Dados do perfil do jogador (mundo atual, rank, DPS) para contextualizar a resposta."),
  userGoalsContext: z.string().optional().describe("As metas atuais que o jogador definiu para si mesmo."),
  history: z.array(MessageSchema).optional().describe('The previous messages in the conversation.'),
  responseStyleInstruction: z.string().optional().describe('Uma instrução específica sobre o estilo de resposta (curta, média, detalhada, tópicos, etc.).'),
  personaInstruction: z.string().optional().describe('Uma instrução específica sobre a persona que a IA deve adotar (amigável, técnico, engraçado, etc.).'),
  languageInstruction: z.string().optional().describe('Uma instrução específica sobre o idioma em que a resposta deve ser gerada.'),
  emojiInstruction: z.string().optional().describe('Uma instrução sobre como usar emojis.'),
  userName: z.string().optional().describe('O nome do usuário para uma saudação personalizada.'),
  userTitle: z.string().optional().describe('Um título honorífico que o usuário escolheu (Mestre, Campeão, etc.).'),
});

const TableSchema = z.object({
  headers: z.array(z.string()).describe("Um array com os nomes das colunas da tabela."),
  rows: z.array(z.record(z.string())).describe("Um array de objetos, onde cada objeto representa uma linha e as chaves correspondem aos cabeçalhos."),
});

const SectionSchema = z.object({
  marcador: z.enum(["texto_introdutorio", "meio", "fim"]).describe("O marcador da seção."),
  titulo: z.string().describe("O título da seção."),
  conteudo: z.string().describe("O conteúdo em texto da seção, formatado em Markdown."),
  table: TableSchema.optional().describe("Se esta seção contiver uma tabela de DADOS (stats, custos, etc.), forneça os dados estruturados aqui. NÃO use para listas de links."),
});

const GenerateSolutionOutputSchema = z.object({
  structuredResponse: z.array(SectionSchema).describe("Um array de objetos de seção que compõem a resposta completa."),
});

export async function generateSolution(input) {
  const fallbackResponse = {
    structuredResponse: [{
      marcador: 'texto_introdutorio',
      titulo: 'Resposta não encontrada',
      conteudo: 'Desculpe, eu sou o Gui, e ainda não tenho a resposta para esta pergunta. Um especialista será notificado para me ensinar.'
    }]
  };

  try {
    // Adiciona fallbacks para instruções não fornecidas
    const personaInstruction = input.personaInstruction || personas.amigavel.instruction;
    const responseStyle = input.responseStyleInstruction || responseStyles.detailed.instruction;
    const language = input.languageInstruction || allLanguages.pt_br.instruction;
    const emoji = input.emojiInstruction || emojiStyles.moderate.instruction;

    // Processa histórico
    const historyText = input.history 
      ? input.history.map(m => `- ${m.role}: ${m.content}`).join('\n')
      : '';

    // Saudação personalizada
    let greeting = 'Olá!';
    if (input.userTitle && input.userName) {
      greeting = `Olá, ${input.userTitle} ${input.userName}!`;
    } else if (input.userName) {
      greeting = `Olá, ${input.userName}!`;
    }

    const systemPrompt = `Você é o Gui, um assistente especialista no jogo Anime Eternal.

**PERSONALIDADE:** ${personaInstruction}
**ESTILO DE RESPOSTA:** ${responseStyle}
**USO DE EMOJIS:** ${emoji}

**IDIOMA FINAL:** ${language}
- Traduza e adapte culturalmente a resposta para o idioma solicitado.

**ESTRUTURA DA RESPOSTA (JSON OBRIGATÓRIO):**
Sua resposta DEVE ser um objeto JSON contendo a chave "structuredResponse", que é um array de objetos de seção.

**Estrutura de cada objeto de seção JSON:**
- \`marcador\`: Use "texto_introdutorio", "meio", ou "fim".
- \`titulo\`: O título da seção (ex: "Solução Direta", "Análise de Farm").
- \`conteudo\`: O conteúdo textual da seção em formato Markdown.
- \`table\`: (Opcional) Se a seção contiver dados tabulares, forneça os dados estruturados.

**REGRAS CRÍTICAS:**
1. Comece SEMPRE com marcador "texto_introdutorio" e use a saudação: ${greeting}
2. Use o wiki abaixo como base de conhecimento
3. Se houver perfil do usuário, personalize a resposta
4. Responda em JSON válido com a chave "structuredResponse"

**REGRAS DE CÁLCULO:**
- DPS com fast click: (Dano Base * 5)
- Dano de lutadores JÁ ESTÁ incluído no DPS (não adicione novamente)`;

    const userPrompt = `${systemPrompt}

${input.userProfileContext ? `CONTEXTO DO PERFIL DO USUÁRIO:\n${input.userProfileContext}\n` : ''}
${input.userGoalsContext ? `METAS DO USUÁRIO:\n${input.userGoalsContext}\n` : ''}
${historyText ? `HISTÓRICO DA CONVERSA:\n${historyText}\n` : ''}

INÍCIO DO CONTEÚDO DO WIKI:
${input.wikiContext}
FIM DO CONTEÚDO DO WIKI

Descrição do Problema: ${input.problemDescription}`;

    const result = await chatStructured({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'minimax/minimax-m2.5:free',
      temperature: 0.3,
    });

    if (!result) {
      return fallbackResponse;
    }

    const parsed = JSON.parse(result);
    
    if (!parsed.structuredResponse || !Array.isArray(parsed.structuredResponse) || parsed.structuredResponse.length === 0) {
      console.warn("A IA retornou uma resposta vazia ou mal formatada. Acionando fallback.");
      return fallbackResponse;
    }

    return { structuredResponse: parsed.structuredResponse };
  } catch (error) {
    console.error("Erro no fluxo de geração de solução:", error);
    return fallbackResponse;
  }
}
