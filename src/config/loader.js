// src/config/loader.js
import 'dotenv/config';

export function loadConfig(logger) {
    const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
    let hasError = false;

    for (const variable of requiredEnv) {
        if (!process.env[variable]) {
            logger.error(`Variável de ambiente obrigatória não definida: ${variable}`);
            hasError = true;
        }
    }

    if (hasError) {
        return null;
    }
    
    return {
        DISCORD_TOKEN: process.env.DISCORD_TOKEN,
        CLIENT_ID: process.env.CLIENT_ID,
        GUILD_ID: process.env.GUILD_ID,
        VERIFIED_ROLE_ID: process.env.VERIFIED_ROLE_ID || '1429278854874140732',
        CHAT_CHANNEL_ID: process.env.CHAT_CHANNEL_ID || '1429309293076680744',
        COMMUNITY_HELP_CHANNEL_ID: process.env.COMMUNITY_HELP_CHANNEL_ID || '1426957344897761282',
        MOD_CURATION_CHANNEL_ID: process.env.MOD_CURATION_CHANNEL_ID || '1426968477482225716',
        CODES_CHANNEL_ID: process.env.CODES_CHANNEL_ID || '1429346813919494214',
    };
}
