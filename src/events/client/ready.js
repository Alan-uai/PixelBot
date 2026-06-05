import { Events, REST, Routes } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client, container) {
    const { logger, commands, config, services } = container;
    const { tenantConfig } = services;

    logger.info(`Pronto! Logado como ${client.user.tag}`);

    const rest = new REST().setToken(config.DISCORD_TOKEN);
    const commandData = Array.from(commands.values()).map(c => c.data.toJSON ? c.data.toJSON() : c.data);

    try {
        logger.info(`Iniciada a atualização de ${commandData.length} comandos de aplicação (/).`);
        const data = await rest.put(
            Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
            { body: commandData },
        );
        logger.info(`Recarregados com sucesso ${data.length} comandos de aplicação (/).`);
    } catch (error) {
        logger.error('Erro ao registrar comandos de aplicação:', error);
    }

    if (tenantConfig) {
        for (const [guildId, guildConfig] of tenantConfig.guildConfigs) {
            const discordGuild = client.guilds.cache.get(guildId);
            if (discordGuild) {
                await tenantConfig.applyGuildConfig(discordGuild, guildConfig);
                logger.info(`Config aplicada na guild ${discordGuild.name} (${guildId})`);
            }
        }

        tenantConfig.subscribeToRealtime(client);
        logger.info('Inscrição Realtime para mudanças de config ativada.');
    }

    logger.info('PixelBot inicializado com sucesso!');
}
