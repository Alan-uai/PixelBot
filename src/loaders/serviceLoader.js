import { initSupabase, getClient } from '../supabase/index.js';
import { WikiService } from '../services/wikiService.js';
import { DataCompilerService } from '../services/dataCompiler.js';
import { TenantConfigService } from '../services/tenantConfig.js';
import { CooldownManager } from '../cooldowns/manager.js';

export async function loadServices(container) {
    const { logger, config, services } = container;

    const supabase = initSupabase(config);
    if (!supabase) {
        logger.error('Falha ao inicializar o cliente Supabase.');
        throw new Error('Supabase client init failed');
    }
    services.supabase = supabase;
    services.getClient = getClient;
    logger.info('Serviço Supabase inicializado com sucesso.');

    try {
        const dataCompiler = new DataCompilerService({ supabase, logger });
        services.dataCompiler = dataCompiler;
        logger.info('Serviço de Compilação de Dados inicializado (loading sob demanda).');
    } catch (error) {
        logger.error('Falha ao inicializar o serviço de Compilação de Dados:', error);
        throw error;
    }

    try {
        const wikiService = new WikiService(services.dataCompiler, logger);
        services.wikiContext = wikiService;
        logger.info('Serviço de Base de Conhecimento inicializado (loading sob demanda).');
    } catch (error) {
        logger.error('Falha ao inicializar o serviço da Base de Conhecimento:', error);
        throw error;
    }

    try {
        const tenantConfig = new TenantConfigService({ supabase, getClient, config, logger });
        await tenantConfig.initialize();
        services.tenantConfig = tenantConfig;
        logger.info('Serviço de Configuração Multi-Tenant inicializado.');
    } catch (error) {
        logger.error('Falha ao inicializar o serviço Multi-Tenant:', error);
        throw error;
    }

    try {
        services.cooldowns = new CooldownManager();
        logger.info('Gerenciador de Cooldowns inicializado.');
    } catch (error) {
        logger.error('Falha ao inicializar o gerenciador de cooldowns:', error);
        throw error;
    }
}
