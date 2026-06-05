import 'dotenv/config';
import http from 'node:http';
import { Client, GatewayIntentBits, Collection } from 'discord.js';

import { loadConfig } from './config/loader.js';
import { createLogger } from './utils/logger.js';
import { loadCommands } from './loaders/commandLoader.js';
import { loadEvents } from './loaders/eventLoader.js';
import { loadInteractions } from './loaders/interactionLoader.js';
import { loadJobs } from './loaders/jobLoader.js';
import { loadServices } from './loaders/serviceLoader.js';

async function start() {
    const logger = createLogger(process.env.NODE_ENV === 'development' ? 'debug' : 'info');

    const config = loadConfig(logger);
    if (!config) {
        logger.error('Falha ao carregar a configuração. Encerrando.');
        process.exit(1);
    }

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.GuildScheduledEvents,
        ],
    });

    const container = {
        client,
        config,
        logger,
        commands: new Collection(),
        interactions: new Collection(),
        services: {},
        jobs: [],
    };

    client.container = container;

    try {
        logger.info('Inicializando serviços...');
        await loadServices(container);

        logger.info('Carregando comandos de barra...');
        await loadCommands(container);

        logger.info('Carregando manipuladores de interação...');
        await loadInteractions(container);

        logger.info('Carregando eventos do cliente...');
        await loadEvents(container);

        await client.login(config.DISCORD_TOKEN);

        logger.info('Iniciando tarefas agendadas (jobs)...');
        loadJobs(container);

    } catch (err) {
        logger.error('Erro fatal durante a inicialização:', err);
        process.exit(1);
    }

    process.on('SIGTERM', () => gracefulShutdown(client, container, logger));
    process.on('SIGINT', () => gracefulShutdown(client, container, logger));
}

async function gracefulShutdown(client, container, logger) {
    logger.info('Sinal de encerramento recebido. Iniciando shutdown gracioso...');

    if (container.services.tenantConfig?.unsubscribe) {
        container.services.tenantConfig.unsubscribe();
        logger.info('Inscrição Realtime cancelada.');
    }

    if (container.services.cooldowns?.destroy) {
        container.services.cooldowns.destroy();
        logger.info('Cooldown manager finalizado.');
    }

    for (const job of container.jobs) {
        if (typeof job.stop === 'function') {
            job.stop();
        }
    }
    logger.info(`${container.jobs.length} job(s) parado(s).`);

    try {
        await client.destroy();
        logger.info('Cliente Discord desconectado.');
    } catch (err) {
        logger.error('Erro ao desconectar cliente Discord:', err);
    }

    logger.info('Shutdown concluído. Até logo!');
    process.exit(0);
}

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is running!\n');
        return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found\n');
}).listen(port, () => {
    console.log(`Servidor web de health check ouvindo na porta ${port}`);
});

start();

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});
