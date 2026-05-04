// src/commands/utility/personalizar-idioma-oficial.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { officialLanguages } from '../../ai/official-languages.js';

export const data = new SlashCommandBuilder()
    .setName('personalizar-idioma-oficial')
    .setDescription('Escolha um idioma oficial para as respostas do Gui.');

export async function execute(interaction, container) {
    const options = Object.entries(officialLanguages).map(([key, value]) => ({
        label: value.name,
        value: key,
        description: value.description?.substring(0, 100) || key
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('personalizar-idioma-select')
        .setPlaceholder('Selecione o idioma oficial...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: 'Selecione o idioma oficial que o Gui deve usar nas respostas:',
        components: [row],
        ephemeral: true
    });
}