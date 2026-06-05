import { SlashCommandBuilder } from 'discord.js';
import { fetchCodes, resolveGuildTenant } from '../../supabase/index.js';

export const data = new SlashCommandBuilder()
    .setName('codes')
    .setDescription('Mostra todos os códigos ativos do jogo.');

export async function execute(interaction, container) {
    await interaction.deferReply({ ephemeral: true });

    const { logger } = container;

    try {
        let tenantId = null;

        if (interaction.guildId) {
            const guildTenant = await resolveGuildTenant(interaction.guildId);
            if (guildTenant) {
                tenantId = guildTenant.tenantId;
            }
        }

        if (!tenantId) {
            return interaction.editReply('Nenhum tenant encontrado para este servidor.');
        }

        const codes = await fetchCodes(tenantId);

        if (!codes || codes.length === 0) {
            return interaction.editReply('Nenhum código ativo encontrado no momento.');
        }

        const formattedCodes = codes.map(c => {
            const rewards = c.rewards || c.reward_type || '';
            const type = c.type ? `[${c.type}]` : '';
            return `• \`${c.code}\` ${type} ${rewards}`;
        }).join('\n');

        await interaction.editReply({
            content: `**Códigos Ativos**\n\n${formattedCodes}`,
        });

    } catch (error) {
        logger.error('Erro ao buscar códigos:', error);
        await interaction.editReply('Ocorreu um erro ao buscar a lista de códigos.');
    }
}
