// src/commands/utility/personalizar-estilo.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { responseStyles } from '../../ai/response-styles.js';

export const data = new SlashCommandBuilder()
    .setName('personalizar-estilo')
    .setDescription('Escolha o estilo de resposta do Gui.');

export async function execute(interaction, container) {
    const options = Object.entries(responseStyles).map(([key, value]) => ({
        label: value.name,
        value: key,
        description: value.description?.substring(0, 100) || key
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('personalizar-estilo-select')
        .setPlaceholder('Selecione o estilo de resposta...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: 'Selecione o estilo de resposta que o Gui deve usar:',
        components: [row],
        ephemeral: true
    });
}