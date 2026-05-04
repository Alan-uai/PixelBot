// src/commands/utility/personalizar-idioma-divertido.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { funLanguages } from '../../ai/fun-languages.js';

export const data = new SlashCommandBuilder()
    .setName('personalizar-idioma-divertido')
    .setDescription('Escolha um idioma divertido (gírias, memes) para as respostas do Gui.');

export async function execute(interaction, container) {
    const options = Object.entries(funLanguages).map(([key, value]) => ({
        label: value.name,
        value: key,
        description: value.description?.substring(0, 100) || key
    }));

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('personalizar-idioma-select')
        .setPlaceholder('Selecione o idioma divertido...')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: 'Selecione o idioma divertido que o Gui deve usar nas respostas:',
        components: [row],
        ephemeral: true
    });
}