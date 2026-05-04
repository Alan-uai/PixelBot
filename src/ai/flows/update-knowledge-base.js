// PixelBot/src/ai/flows/update-knowledge-base.js
import { chatStructured } from '../openrouter-client.js';
import { z } from 'zod';

const UpdateKnowledgeBaseInputSchema = z.object({
  question: z.string().describe('A pergunta original feita pelo usuário que a IA não conseguiu responder.'),
  approvedAnswers: z.array(z.string()).describe('uma lista de respostas fornecidas pela comunidade que foram aprovadas por um moderador.'),
  currentKnowledgeBase: z.string().describe('O conteúdo completo de todos os arquivos da wiki atual, para ser usado como contexto sobre a estrutura e os dados existentes.'),
  moderatorInstructions: z.string().optional().describe('Instruções adicionais do moderador para guiar a criação ou atualização do conteúdo.'),
});

const UpdateKnowledgeBaseOutputSchema = z.object({
  filePath: z.string().describe('O caminho completo do arquivo a ser criado ou atualizado (ex: src/data/worlds/world-25-data.js ou src/data/wiki-articles/novo-guia.js).'),
  fileContent: z.string().describe('O conteúdo JavaScript completo e formatado do arquivo. Deve ser um código válido que possa ser salvo diretamente.'),
  reasoning: z.string().describe('Uma breve explicação do porquê desta ação (criar vs. atualizar) e como o conteúdo foi estruturado.'),
});

export async function updateKnowledgeBase(input) {
  const fallbackResponse = {
    filePath: 'src/data/wiki-articles/sugestao-comunidade.js',
    fileContent: `// IA não conseguiu determinar o local correto.\n// Pergunta: ${input.question}\n// Respostas: ${JSON.stringify(input.approvedAnswers, null, 2)}`,
    reasoning: 'A IA não conseguiu determinar onde salvar a informação e gerou um arquivo de fallback para análise manual.',
  };

  const approvedAnswersText = input.approvedAnswers.map((ans, i) => `${i + 1}. ${ans}`).join('\n');
  const moderatorInstructionsText = input.moderatorInstructions 
    ? `\n**Instruções do Moderador (Prioridade Máxima):**\n${input.moderatorInstructions}`
    : '';

  const userPrompt = `Você é um desenvolvedor especialista em JavaScript e um arquiteto de dados para o bot "Gui" do jogo Anime Eternal. Sua tarefa é analisar uma pergunta não respondida e as respostas aprovadas pela comunidade para atualizar a base de conhecimento do bot.

**OBJETIVO PRINCIPAL:**
Sintetizar as informações da comunidade em um novo artigo da wiki ou atualizar um artigo existente. A saída DEVE ser um arquivo JavaScript completo e bem estruturado.

**REGRAS DE ARQUITETURA DE DADOS (OBRIGATÓRIO):**
1. **Estrutura de Arquivos:**
   * Dados específicos de um mundo (NPCs, pets, poderes, etc.) DEVEM ir para um arquivo em \`src/data/worlds/world-XX-data.js\`.
   * Guias gerais, tutoriais ou informações que abrangem múltiplos mundos DEVEM ir para um novo arquivo em \`src/data/wiki-articles/nome-do-artigo.js\`.
   * O nome do arquivo deve ser em kebab-case (ex: \`novo-guia-de-pets.js\`).

2. **Formato do Arquivo (OBRIGATÓRIO):**
   * O arquivo DEVE exportar uma constante (ex: \`export const worldXXData = { ... }\`).
   * O objeto exportado DEVE conter:
       * \`id\`: (string) ID único em kebab-case (ex: 'world-25' ou 'novo-guia-de-pets').
       * \`title\`: (string) Título legível do artigo (ex: 'Mundo 25 - Ilha da Neblina').
       * \`summary\`: (string) Um resumo curto do conteúdo.
       * \`tags\`: (array de strings) Palavras-chave relevantes em minúsculas.
       * Propriedades de dados estruturados (npcs, pets, powers, tables, content, etc.), seguindo o padrão dos outros arquivos na base de conhecimento.

**PROCESSO DE RACIOCÍNIO:**

1. **Analisar a Pergunta e Respostas:**
   * Qual é o tópico central da pergunta do usuário? (ex: "Qual o melhor pet?", "Como funciona a raid X?", "Onde fica o NPC Y?").
   * Qual informação crucial as respostas da comunidade fornecem? Compile e sintetize os fatos.

2. **Analisar a Base de Conhecimento Atual (\`currentKnowledgeBase\`):**
   * O tópico já existe? Pesquise por títulos, resumos e tags nos artigos existentes.
   * **SE EXISTIR:** Você DEVE atualizar o arquivo existente.
       * Identifique o \`filePath\` do arquivo a ser modificado.
       * Integre a nova informação. Se for uma tabela, adicione novas linhas. Se for texto, adicione uma nova seção no \`content\`. Preserve toda a informação original.
   * **SE NÃO EXISTIR:** Você DEVE criar um novo arquivo.
       * Decida o \`filePath\` apropriado (\`worlds\` ou \`wiki-articles\`).
       * Crie um \`id\`, \`title\`, \`summary\`, e \`tags\` apropriados.
       * Estruture as informações da comunidade no formato correto (texto, tabelas, listas de objetos, etc.).

3. **SE HOUVER INSTRUÇÕES DO MODERADOR, SIGA-AS ESTRITAMENTE.** Elas têm prioridade sobre sua análise automática. Use-as para corrigir o caminho do arquivo, adicionar campos específicos ou alterar a estrutura.

4. **Gerar o Código JavaScript (\`fileContent\`):**
   * Escreva o código JavaScript completo para o arquivo.
   * Siga TODAS as convenções de estilo e formatação dos arquivos existentes. Use indentação correta, vírgulas, etc.
   * O código gerado deve ser imediatamente executável e sem erros de sintaxe.

**BASE DE CONHECIMENTO ATUAL (CONTEXTO):**
${input.currentKnowledgeBase}

---

**TAREFA:**

**Pergunta do Usuário:**
${input.question}

**Respostas Aprovadas pela Comunidade:**
${approvedAnswersText}
${moderatorInstructionsText}

Gere o objeto JSON com \`filePath\`, \`fileContent\`, e \`reasoning\` para atualizar a base de conhecimento.`;

  try {
    const result = await chatStructured({
      messages: [
        { role: 'system', content: 'Você é um especialista em gerar código JavaScript e arquitetar dados. Sempre responda em JSON válido.' },
        { role: 'user', content: userPrompt },
      ],
      model: 'openai/gpt-4o-mini',
      temperature: 0.3,
    });

    if (!result) {
      return fallbackResponse;
    }

    const parsed = JSON.parse(result);
    
    if (!parsed.filePath || !parsed.fileContent) {
      console.error("A IA não gerou uma saída válida.", parsed);
      return fallbackResponse;
    }

    return {
      filePath: parsed.filePath,
      fileContent: parsed.fileContent,
      reasoning: parsed.reasoning || 'Sem raciocínio fornecido.',
    };
  } catch (error) {
    console.error('Erro no fluxo de atualização da base de conhecimento:', error);
    return fallbackResponse;
  }
}
