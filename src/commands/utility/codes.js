// src/commands/utility/codes.js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('codes')
    .setDescription('Mostra todos os códigos ativos do jogo.');

export async function execute(interaction, container) {
    await interaction.deferReply({ ephemeral: true });

    const { services } = container;
    const { supabase } = services;

    try {
        const { data, error } = await supabase
            .from('bot_config')
            .select('value')
            .eq('key', 'gameCodes')
            .single();

        if (error || !data?.value?.codes || data.value.codes.length === 0) {
            return interaction.editReply('Nenhum código ativo encontrado no momento.');
        }

        const codes = data.value.codes;
        const formattedCodes = codes.map(code => `• \`${code}\``).join('\n');

        const messageContent = `**Códigos Ativos do Jogo**\n\n${formattedCodes}`;

        await interaction.editReply({ content: messageContent });

    } catch (error) {
        console.error('Erro ao buscar códigos:', error);
        await interaction.editReply('Ocorreu um erro ao buscar a lista de códigos.');
    }
}