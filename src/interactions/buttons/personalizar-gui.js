// src/interactions/buttons/personalizar-gui.js
import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { supabase } from '../../supabase/index.js';
import { personas } from '../../ai/personas.js';
import { responseStyles } from '../../ai/response-styles.js';
import { officialLanguages } from '../../ai/official-languages.js';
import { funLanguages } from '../../ai/fun-languages.js';
import { emojiStyles } from '../../ai/emoji-styles.js';

export const customIdPrefix = 'personalize';

const PANELS = {
    style: {
        id: `${customIdPrefix}_style`,
        data: responseStyles,
        field: 'aiResponsePreference',
        title: 'Estilo de Resposta',
        default: 'detailed'
    },
    persona: {
        id: `${customIdPrefix}_persona`,
        data: personas,
        field: 'aiPersonality',
        title: 'Personalidade',
        default: 'amigavel'
    },
    language: { 
        id_prefix: `${customIdPrefix}_language`,
        field: 'aiLanguage',
        title: 'Idioma',
        default: 'pt_br'
    },
    emoji: {
        id: `${customIdPrefix}_emoji`,
        data: emojiStyles,
        field: 'aiEmojiPreference',
        title: 'Uso de Emojis',
        default: 'moderate'
    }
};

const PROFILE_UPDATE_MODAL_ID = `${customIdPrefix}_profile_modal`;
const PROFILE_UPDATE_BUTTON_ID = `${customIdPrefix}_profile_update`;
const PROFILE_CONTEXT_TOGGLE_ID = `${customIdPrefix}_profile_context_toggle`;


// Função para buscar ou criar um perfil de usuário no Supabase
async function getOrCreateUserProfile(userId, username) {
    const { data, error } = await supabase
        .from('bot_config')
        .select('value')
        .eq('key', `user_config_${userId}`)
        .single();

    if (data?.value) {
        return data.value;
    }
    
    const newUserProfile = {
        id: userId,
        username,
        reputationPoints: 0,
        credits: 0,
        aiResponsePreference: 'detailed',
        aiPersonality: 'amigavel',
        aiLanguage: 'pt_br',
        aiEmojiPreference: 'moderate',
        aiUseProfileContext: false,
    };
    
    await supabase
        .from('bot_config')
        .upsert({ 
            key: `user_config_${userId}`, 
            value: newUserProfile 
        });
    
    return newUserProfile;
}

export async function openAIPanel(interaction, panelType) {
    const userData = await getOrCreateUserProfile(interaction.user.id, interaction.user.username);
    
    const panelConfig = PANELS[panelType];
    if (!panelConfig) return;

    const allLanguages = { ...officialLanguages, ...funLanguages };
    
    if (panelType === 'language') {
        const options = Object.entries(allLanguages).map(([key, lang]) => ({
            label: lang.name,
            value: key,
            default: key === userData[panelConfig.field]
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(panelConfig.id)
            .setPlaceholder('Selecione um idioma')
            .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({ content: `🌍 **${panelConfig.title}**\nSelecione o idioma que você prefere que eu use nas respostas:`, components: [row], ephemeral: true });
    } else {
        const options = Object.entries(panelConfig.data).map(([key, item]) => ({
            label: item.name,
            value: key,
            default: key === userData[panelConfig.field]
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(panelConfig.id)
            .setPlaceholder(`Selecione um ${panelConfig.title.toLowerCase()}`)
            .addOptions(options);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        await interaction.reply({ content: `⚙️ **${panelConfig.title}**\nSelecione a opção desejada:`, components: [row], ephemeral: true });
    }
}

export async function handlePanelSelection(interaction, panelType) {
    const panelConfig = PANELS[panelType];
    if (!panelConfig) return;
    
    const selectedValue = interaction.values[0];
    const userId = interaction.user.id;
    
    const currentData = await getOrCreateUserProfile(userId, interaction.user.username);
    currentData[panelConfig.field] = selectedValue;
    
    await supabase
        .from('bot_config')
        .upsert({ 
            key: `user_config_${userId}`, 
            value: currentData 
        });
    
    const panelTitle = panelConfig.title;
    const selectedLabel = panelType === 'language' 
        ? (({ ...officialLanguages, ...funLanguages })[selectedValue]?.name || selectedValue)
        : (panelConfig.data[selectedValue]?.name || selectedValue);
    
    await interaction.update({ 
        content: `✅ **${panelTitle} atualizado!**\n\nNova configuração: **${selectedLabel}**`,
        components: [],
        embeds: []
    });
}

export async function openProfileModal(interaction) {
    const userData = await getOrCreateUserProfile(interaction.user.id, interaction.user.username);
    
    const modal = new ModalBuilder()
        .setCustomId(PROFILE_UPDATE_MODAL_ID)
        .setTitle('Atualizar Perfil');
    
    const customNameInput = new TextInputBuilder()
        .setCustomId('customName')
        .setLabel('Nome Personalizado')
        .setStyle(TextInputStyle.Short)
        .setValue(userData.customName || '')
        .setPlaceholder('Como você quer ser chamado?')
        .setRequired(false);
    
    const currentWorldInput = new TextInputBuilder()
        .setCustomId('currentWorld')
        .setLabel('Mundo Atual')
        .setStyle(TextInputStyle.Short)
        .setValue(userData.currentWorld || '')
        .setPlaceholder('Ex: World 10')
        .setRequired(false);
    
    const rankInput = new TextInputBuilder()
        .setCustomId('rank')
        .setLabel('Seu Rank')
        .setStyle(TextInputStyle.Short)
        .setValue(userData.rank || '')
        .setPlaceholder('Ex: 150')
        .setRequired(false);
    
    const dpsInput = new TextInputBuilder()
        .setCustomId('dps')
        .setLabel('Seu DPS (opcional)')
        .setStyle(TextInputStyle.Short)
        .setValue(userData.dps || '')
        .setPlaceholder('Seu DPS estimado')
        .setRequired(false);
    
    modal.addComponents(
        new ActionRowBuilder().addComponents(customNameInput),
        new ActionRowBuilder().addComponents(currentWorldInput),
        new ActionRowBuilder().addComponents(rankInput),
        new ActionRowBuilder().addComponents(dpsInput)
    );
    
    await interaction.showModal(modal);
}

export async function handleProfileModalSubmit(interaction) {
    const customName = interaction.fields.getTextInputValue('customName');
    const currentWorld = interaction.fields.getTextInputValue('currentWorld');
    const rank = interaction.fields.getTextInputValue('rank');
    const dps = interaction.fields.getTextInputValue('dps');
    
    const userId = interaction.user.id;
    const currentData = await getOrCreateUserProfile(userId, interaction.user.username);
    
    if (customName) currentData.customName = customName;
    if (currentWorld) currentData.currentWorld = currentWorld;
    if (rank) currentData.rank = rank;
    if (dps) currentData.dps = dps;
    
    await supabase
        .from('bot_config')
        .upsert({ 
            key: `user_config_${userId}`, 
            value: currentData 
        });
    
    await interaction.reply({ content: '✅ **Perfil atualizado com sucesso!**', ephemeral: true });
}

export async function toggleProfileContext(interaction) {
    const userData = await getOrCreateUserProfile(interaction.user.id, interaction.user.username);
    const newValue = !userData.aiUseProfileContext;
    
    userData.aiUseProfileContext = newValue;
    
    await supabase
        .from('bot_config')
        .upsert({ 
            key: `user_config_${interaction.user.id}`, 
            value: userData 
        });
    
    await interaction.update({ 
        content: newValue 
            ? '✅ **Contexto do perfil ativado!**\n\nAgora eu considerarei seu mundo atual, rank e DPS ao responder suas perguntas.'
            : '❌ **Contexto do perfil desativado.**\n\nAs respostas serão mais genéricas, sem considerar seu progresso específico.',
        components: [],
        embeds: []
    });
}

export async function createPersonalizationMainMenu(interaction) {
    const userData = await getOrCreateUserProfile(interaction.user.id, interaction.user.username);
    
    const embed = new EmbedBuilder()
        .setTitle('⚙️ Personalização do Assistente')
        .setDescription('Configure como o Gui deve interagir com você:')
        .setColor(0x5865F2)
        .addFields(
            { name: '🎨 Estilo de Resposta', value: responseStyles[userData.aiResponsePreference]?.name || 'Padrão', inline: true },
            { name: '😀 Personalidade', value: personas[userData.aiPersonality]?.name || 'Padrão', inline: true },
            { name: '🌍 Idioma', value: (({ ...officialLanguages, ...funLanguages })[userData.aiLanguage]?.name || 'Padrão'), inline: true },
            { name: '😎 Emojis', value: emojiStyles[userData.aiEmojiPreference]?.name || 'Padrão', inline: true },
            { name: '📊 Contextualizar', value: userData.aiUseProfileContext ? '✅ Ativado' : '❌ Desativado', inline: true }
        );
    
    const styleButton = new ButtonBuilder()
        .setCustomId('personalize_style')
        .setLabel('🎨 Estilo')
        .setStyle(ButtonStyle.Secondary);
    
    const personaButton = new ButtonBuilder()
        .setCustomId('personalize_persona')
        .setLabel('😀 Personalidade')
        .setStyle(ButtonStyle.Secondary);
    
    const languageButton = new ButtonBuilder()
        .setCustomId('personalize_language')
        .setLabel('🌍 Idioma')
        .setStyle(ButtonStyle.Secondary);
    
    const emojiButton = new ButtonBuilder()
        .setCustomId('personalize_emoji')
        .setLabel('😎 Emojis')
        .setStyle(ButtonStyle.Secondary);
    
    const profileButton = new ButtonBuilder()
        .setCustomId(PROFILE_UPDATE_BUTTON_ID)
        .setLabel('📝 Meu Perfil')
        .setStyle(ButtonStyle.Primary);
    
    const contextButton = new ButtonBuilder()
        .setCustomId(PROFILE_CONTEXT_TOGGLE_ID)
        .setLabel('📊 Contextualizar')
        .setStyle(ButtonStyle.Secondary);
    
    const firstRow = new ActionRowBuilder().addComponents(styleButton, personaButton, languageButton, emojiButton);
    const secondRow = new ActionRowBuilder().addComponents(profileButton, contextButton);
    
    await interaction.reply({ embeds: [embed], components: [firstRow, secondRow], ephemeral: true });
}
