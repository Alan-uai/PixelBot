import { SlashCommandBuilder, PermissionsBitField, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('clean')
    .setDescription('Apaga uma quantidade específica de mensagens (máx 100).')
    .addIntegerOption(option =>
        option.setName('quantidade')
            .setDescription('O número de mensagens para apagar (1-100).')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages);

export async function execute(interaction) {
    const member = interaction.member;
    const isOwner = interaction.guild.ownerId === member.id;
    const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
    const hasManageMessages = member.permissions.has(PermissionsBitField.Flags.ManageMessages);

    if (!isOwner && !isAdmin && !hasManageMessages) {
        return interaction.reply({
            content: 'Você não tem permissão para usar este comando.',
            ephemeral: true,
        });
    }

    const quantidade = interaction.options.getInteger('quantidade');

    if (interaction.channel.type === ChannelType.DM) {
        return interaction.reply({
            content: 'Este comando não pode ser usado em DMs.',
            ephemeral: true
        });
    }

    try {
        await interaction.deferReply({ ephemeral: true });
        
        const deleted = await interaction.channel.bulkDelete(quantidade, true); // O `true` filtra mensagens com mais de 14 dias

        await interaction.editReply({
            content: `Foram apagadas ${deleted.size} mensagens com sucesso!`,
        });

    } catch (error) {
        console.error('Erro ao tentar apagar mensagens em massa:', error);
        await interaction.editReply({
            content: 'Ocorreu um erro ao tentar apagar as mensagens. Eu não posso apagar mensagens com mais de 14 dias.',
        });
    }
}
