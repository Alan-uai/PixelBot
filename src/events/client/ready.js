// src/events/client/ready.js
import { Events, REST, Routes } from 'discord.js';
import { supabase } from '../../supabase/index.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client, container) {
    const { logger, commands, config } = container;
    
    logger.info(`Pronto! Logado como ${client.user.tag}`);
    
    // Deploy de comandos do Discord
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
    
    logger.info('PixelBot inicializado com sucesso!');
}
