// src/commands/utility/personalizar-emojis.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { emojiStyles } from '../../ai/emoji-styles.js';

export const data = new SlashCommandBuilder()
    .setName('personalizar-emojis')
    .setDescription('Escolha como o Gui deve usar emojis nas respostas.');

export async function execute(interaction, container) {
    const options = Object.entries(emojiStyles).map(([key, value]) => ({
        label: value.name,
        value: key,
        description: value.description?.substring(0, 100) || key
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('personalizar-emojis-select')
        .setPlaceholder('Selecione o uso de emojis...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: 'Selecione como o Gui deve usar emojis nas respostas:',
        components: [row],
        ephemeral: true
    });
}