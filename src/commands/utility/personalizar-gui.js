// src/commands/utility/personalizar-gui.js
import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('personalizar-gui')
    .setDescription('Configure como o Gui interage com você.');

export async function execute(interaction, container) {
    const options = [
        { label: 'Sim', value: 'true', description: 'O Gui usará seu perfil (mundo, rank, DPS) para customizar respostas' },
        { label: 'Não', value: 'false', description: 'O Gui não usará informações do seu perfil nas respostas' },
    ];

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('personalizar-gui-select')
        .setPlaceholder('Usar contexto do perfil?')
        .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: 'Deseja que o Gui use as informações do seu perfil (mundo atual, rank, DPS) para customizar as respostas?',
        components: [row],
        ephemeral: true
    });
}