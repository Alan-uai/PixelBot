// src/events/guild/interactionCreate.js
import { Events } from 'discord.js';
import { officialLanguages, funLanguages } from '../../ai/official-languages.js';
import { personas } from '../../ai/personas.js';
import { responseStyles } from '../../ai/response-styles.js';
import { emojiStyles } from '../../ai/emoji-styles.js';

async function handlePersonalizeInteraction(interaction, container, type, configKey) {
    const { services } = container;
    const { supabase } = services;
    const userId = interaction.user.id;
    const selectedValue = interaction.values[0];

    const { data: existingData } = await supabase
        .from('bot_config')
        .select('value')
        .eq('key', `user_config_${userId}`)
        .single();

    const currentConfig = existingData?.value || {};
    currentConfig[configKey] = selectedValue;

    await supabase
        .from('bot_config')
        .upsert({
            key: `user_config_${userId}`,
            value: currentConfig
        }, { onConflict: 'key' });

    const typeNames = {
        language: 'idioma',
        persona: 'personalidade',
        style: 'estilo de resposta',
        emoji: 'uso de emojis',
        gui: 'configurações'
    };

    await interaction.update({
        content: `✅ ${typeNames[type] || 'Opção'} alterado com sucesso!`,
        components: []
    });
}

export const name = Events.InteractionCreate;

export async function execute(interaction) {
    const { client, commands, interactions, logger, services } = interaction.client.container;
    const { supabase } = services;
    
    if (interaction.isChatInputCommand()) {
        const command = commands.get(interaction.commandName);
        if (!command) {
            logger.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);
            return;
        }
        try {
            if (command.execute) {
                await command.execute(interaction, client.container); 
            }
        } catch (error) {
            logger.error(`Erro ao executar o comando /${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true }).catch(e => logger.error("Falha ao enviar followUp de erro:", e));
            } else {
                await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true }).catch(e => logger.error("Falha ao enviar reply de erro:", e));
            }
        }
        return;
    }

    if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;
        
        if (customId === 'personalizar-idioma-select') {
            await handlePersonalizeInteraction(interaction, client.container, 'language', 'aiLanguage');
            return;
        }
        if (customId === 'personalizar-persona-select') {
            await handlePersonalizeInteraction(interaction, client.container, 'persona', 'aiPersonality');
            return;
        }
        if (customId === 'personalizar-estilo-select') {
            await handlePersonalizeInteraction(interaction, client.container, 'style', 'aiResponsePreference');
            return;
        }
        if (customId === 'personalizar-emojis-select') {
            await handlePersonalizeInteraction(interaction, client.container, 'emoji', 'aiEmojiPreference');
            return;
        }
        if (customId === 'personalizar-gui-select') {
            await handlePersonalizeInteraction(interaction, client.container, 'gui', 'aiUseProfileContext');
            return;
        }
    }

    if (interaction.isButton() || interaction.isModalSubmit() || interaction.isStringSelectMenu()) {
        const customId = interaction.customId;
        
        const handler = Array.from(interactions.entries()).find(([prefix]) => customId.startsWith(prefix));
        
        if (handler) {
            const [prefix, handlerFn] = handler;
            try {
                await handlerFn(interaction, client.container);
            } catch (error) {
                logger.error(`Erro ao lidar com a interação ${customId}:`, error);
                const errorMessage = 'Ocorreu um erro ao processar sua ação.';
                try {
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(e => logger.error("Falha ao enviar followUp de erro de interação:", e));
                    } else {
                        await interaction.reply({ content: errorMessage, ephemeral: true }).catch(e => logger.error("Falha ao enviar reply de erro:", e));
                    }
                } catch(e) {
                    logger.error(`Erro duplo ao tentar responder a uma interação falha: ${e}`);
                }
            }
        } else if (!customId.startsWith('personalizar-')) {
            logger.warn(`Nenhum manipulador de interação encontrado para o customId: ${customId}`);
        }
    }
}