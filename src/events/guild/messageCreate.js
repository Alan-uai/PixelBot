// src/events/guild/messageCreate.js
import { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import { generateSolution } from '../../ai/flows/generate-solution.js';
import { supabase } from '../../supabase/index.js';
import { personas } from '../../ai/personas.js';
import { responseStyles } from '../../ai/response-styles.js';
import { officialLanguages } from '../../ai/official-languages.js';
import { funLanguages } from '../../ai/fun-languages.js';
import { emojiStyles } from '../../ai/emoji-styles.js';


function formatTableAsText(headers, rows) {
    const colWidths = headers.map((h, i) => {
        const maxContent = Math.max(...rows.map(r => String(r[headers[i]] || '').length));
        return Math.max(h.length, maxContent);
    });
    
    const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
    const divider = colWidths.map(w => '-'.repeat(w)).join('-+-');
    const dataRows = rows.map(r => 
        headers.map((h, i) => String(r[headers[i]] || '').padEnd(colWidths[i])).join(' | ')
    );
    
    return `\`\`\`\n${headerRow}\n${divider}\n${dataRows.join('\n')}\n\`\`\``;
}


async function sendConsolidatedReply(message, content, tableText) {
    const feedbackRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(`feedback_like_${message.id}`).setLabel('👍').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`feedback_dislike_${message.author.id}_${message.id}`).setLabel('👎').setStyle(ButtonStyle.Danger)
        );

    const options = {
        content: content || null,
        components: [feedbackRow]
    };
    
    const replyMessage = await message.reply(options);
    
    if (tableText) {
        await message.channel.send(tableText);
    }
    
    return replyMessage;
}


export const name = Events.MessageCreate;

export async function execute(message) {
    const { client, config, logger, services } = message.client.container;
    const { wikiContext, supabase: supabaseClient } = services;

    if (message.author.bot) return;

    if (message.channel.id === config.CHAT_CHANNEL_ID && message.mentions.has(client.user.id) && !message.mentions.everyone) {
        const question = message.content.replace(/<@!?(\d+)>/g, '').trim();
        const imageAttachment = message.attachments.find(att => att.contentType?.startsWith('image/'));

        if (!question && !imageAttachment) {
            await message.reply(`Olá! Meu nome é Gui. Em que posso ajudar sobre o Anime Eternal?`);
            return;
        }

        const typingInterval = setInterval(() => {
            message.channel.sendTyping();
        }, 9000);

        let imageDataUri = null;
        if (imageAttachment) {
            try {
                const response = await axios.get(imageAttachment.url, { responseType: 'arraybuffer' });
                const base64 = Buffer.from(response.data, 'binary').toString('base64');
                imageDataUri = `data:${imageAttachment.contentType};base64,${base64}`;
            } catch (error) {
                logger.error("Erro ao processar a imagem anexada:", error);
            }
        }

        try {
            const { data: userData } = await supabaseClient
                .from('bot_config')
                .select('value')
                .eq('key', `user_config_${message.author.id}`)
                .single();
            
            const configData = userData?.value || {};
            
            const allLanguages = { ...officialLanguages, ...funLanguages };

            const responseStyleKey = configData.aiResponsePreference || 'detailed';
            const personaKey = configData.aiPersonality || 'amigavel';
            const languageKey = configData.aiLanguage || 'pt_br';
            const emojiKey = configData.aiEmojiPreference || 'moderate';
            const useProfileContext = configData.aiUseProfileContext || false;

            const userTitle = configData.userTitle || undefined;
            const userName = configData.customName || message.author.username;

            const responseStyleInstruction = responseStyles[responseStyleKey]?.instruction || '';
            const personaInstruction = personas[personaKey]?.instruction || '';
            const languageInstruction = allLanguages[languageKey]?.instruction || '';
            const emojiInstruction = emojiStyles[emojiKey]?.instruction || '';
            
            let userProfileContext = undefined;
            if (useProfileContext && configData.currentWorld) {
                const { currentWorld, rank, dps } = configData;
                userProfileContext = `Mundo Atual: ${currentWorld || 'N/A'}, Rank: ${rank || 'N/D'}, DPS: ${dps || 'N/D'}`;
            }

            const userGoals = configData.goals || [];
            const userGoalsContext = userGoals.length > 0 ? `Metas do Usuário: ${userGoals.join(', ')}` : undefined;

            const history = [];
            let currentMessage = message;
            const historyLimit = 10;
            try {
                while (currentMessage.reference && history.length < historyLimit) {
                    const repliedToMessage = await currentMessage.channel.messages.fetch(currentMessage.reference.messageId);
                    const role = repliedToMessage.author.id === client.user.id ? 'assistant' : 'user';
                    const content = repliedToMessage.content.replace(/<@!?(\d+)>/g, '').trim();
                    history.unshift({ role, content });
                    currentMessage = repliedToMessage;
                }
            } catch (error) {
                logger.warn("Não foi possível buscar o histórico completo da conversa:", error);
            }

            const result = await generateSolution({
                problemDescription: question,
                imageDataUri: imageDataUri || undefined,
                wikiContext: wikiContext.getContext(),
                userProfileContext,
                userGoalsContext,
                history: history.length > 0 ? history : undefined,
                responseStyleInstruction,
                personaInstruction,
                languageInstruction,
                emojiInstruction,
                userName,
                userTitle,
            });

            clearInterval(typingInterval);

            if (result?.structuredResponse?.[0]?.titulo === 'Resposta não encontrada') {
                await message.reply(result.structuredResponse[0].conteudo);
            } else {
                let finalContent = '';
                let tableText = null;

                for (const section of result.structuredResponse) {
                    if (section.titulo) finalContent += `**${section.titulo}**\n`;
                    if (section.conteudo) finalContent += `${section.conteudo}\n\n`;

                    if (section.table && section.table.rows && section.table.rows.length > 0) {
                        try {
                            tableText = formatTableAsText(section.table.headers, section.table.rows);
                        } catch (tableError) {
                            logger.error("Erro ao formatar a tabela:", tableError);
                            finalContent += `*(Erro ao renderizar a tabela "${section.titulo}".)*\n\n`;
                        }
                    }
                }

                const messageLimit = 2000;
                let replyMessage;

                if (finalContent.length > messageLimit) {
                    const chunks = [];
                    let currentChunk = finalContent;
                    while (currentChunk.length > 0) {
                        let cutIndex = currentChunk.lastIndexOf('\n\n', messageLimit);
                        if (cutIndex === -1) cutIndex = currentChunk.lastIndexOf('\n', messageLimit);
                        if (cutIndex === -1) cutIndex = messageLimit;
                        chunks.push(currentChunk.substring(0, cutIndex));
                        currentChunk = currentChunk.substring(cutIndex);
                    }

                    replyMessage = await sendConsolidatedReply(message, chunks[0], tableText);
                    for (let i = 1; i < chunks.length; i++) {
                        await message.channel.send(chunks[i]);
                    }
                } else {
                    replyMessage = await sendConsolidatedReply(message, finalContent, tableText);
                }
                
                client.container.interactions.set(`question_${message.id}`, question);
                client.container.interactions.set(`answer_${message.id}`, finalContent);
                client.container.interactions.set(`history_${message.id}`, history);
                client.container.interactions.set(`replyMessageId_${message.id}`, replyMessage.id);
            }
        } catch (error) {
            clearInterval(typingInterval);
            logger.error('Erro na execução do evento messageCreate:', error);
            await message.reply('Ocorreu um erro inesperado ao processar sua pergunta. Um especialista foi notificado.').catch(() => {});
        }
        return;
    }
}