// src/loaders/serviceLoader.js
import { supabase } from '../supabase/index.js';
import { WikiService } from '../services/wikiService.js';
import { DataCompilerService } from '../services/dataCompiler.js';

export async function loadServices(container) {
    const { logger, services } = container;

    // Supabase Service
    try {
        services.supabase = supabase;
        logger.info('Serviço Supabase inicializado com sucesso.');
    } catch (error) {
        logger.error('Falha ao inicializar o serviço Supabase:', error);
        throw error;
    }

    // Data Compiler Service
    try {
        const dataCompiler = new DataCompilerService(logger);
        services.dataCompiler = dataCompiler;
        logger.info('Serviço de Compilação de Dados inicializado.');
    } catch (error) {
        logger.error('Falha ao inicializar o serviço de Compilação de Dados:', error);
        throw error;
    }

    // Knowledge Base Service (Wiki)
    try {
        const wikiService = new WikiService(services.dataCompiler, logger);
        services.wikiContext = wikiService;
        logger.info('Serviço de Base de Conhecimento (Wiki) inicializado.');
    } catch (error) {
        logger.error('Falha ao inicializar o serviço da Base de Conhecimento:', error);
        throw error;
    }
}