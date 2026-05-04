// src/commands/utility/personalizar-persona.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { personas } from '../../ai/personas.js';

export const data = new SlashCommandBuilder()
    .setName('personalizar-persona')
    .setDescription('Escolha a personalidade do Gui nas respostas.');

export async function execute(interaction, container) {
    const options = Object.entries(personas).map(([key, value]) => ({
        label: value.name,
        value: key,
        description: value.description?.substring(0, 100) || key
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('personalizar-persona-select')
        .setPlaceholder('Selecione a personalidade...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: 'Selecione a personalidade que o Gui deve usar nas respostas:',
        components: [row],
        ephemeral: true
    });
}