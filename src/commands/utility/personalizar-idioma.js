// src/commands/utility/personalizar-idioma.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { officialLanguages } from '../../ai/official-languages.js';
import { funLanguages } from '../../ai/fun-languages.js';

export const data = new SlashCommandBuilder()
    .setName('personalizar-idioma')
    .setDescription('Escolha um idioma oficial ou divertido para as respostas do Gui.');

export async function execute(interaction, container) {
    const { services } = container;
    const { supabase } = services;

    const allLanguages = { ...officialLanguages, ...funLanguages };
    const options = Object.entries(allLanguages).map(([key, value]) => ({
        label: value.name,
        value: key,
        description: value.description?.substring(0, 100) || key
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('personalizar-idioma-select')
        .setPlaceholder('Selecione o idioma...')
        .addOptions(options.slice(0, 25));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: 'Selecione o idioma que o Gui deve usar nas respostas:',
        components: [row],
        ephemeral: true
    });
}