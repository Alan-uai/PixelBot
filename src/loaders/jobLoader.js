// src/loaders/jobLoader.js
// Jobs foram desabilitados - não há tarefas agendadas no momento
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadJobs(container) {
    const { logger, jobs } = container;
    
    const jobsPath = path.join(__dirname, '..', 'jobs');
    
    if (!fs.existsSync(jobsPath)) {
        logger.info('Nenhum job configurado.');
        jobs.length = 0;
        return;
    }
    
    const jobFiles = fs.readdirSync(jobsPath).filter(file => file.endsWith('.js'));
    
    if (jobFiles.length === 0) {
        logger.info('Nenhum job configurado.');
        return;
    }
    
    const cron = (await import('node-cron')).default;
    
    for (const file of jobFiles) {
        try {
            const jobModule = await import(`file://${jobsPath}/${file}?t=${Date.now()}`);
            
            if (Object.keys(jobModule).length === 0) {
                continue;
            }
            
            if (!jobModule.name || typeof jobModule.run !== 'function') {
                logger.warn(`Job inválido em ${file}: faltando name ou run.`);
                continue;
            }
            
            if (jobModule.schedule) {
                if (cron.validate(jobModule.schedule)) {
                    const task = cron.schedule(jobModule.schedule, () => jobModule.run(container), {
                        timezone: "America/Sao_Paulo"
                    });
                    jobs.push({ name: jobModule.name, stop: () => task.stop() });
                    logger.info(`Job agendado: ${jobModule.name}`);
                }
            } else if (jobModule.intervalMs) {
                const intervalId = setInterval(() => jobModule.run(container), jobModule.intervalMs);
                jobs.push({ name: jobModule.name, stop: () => clearInterval(intervalId) });
                logger.info(`Job via intervalo: ${jobModule.name}`);
            }
            
        } catch (err) {
            logger.error(`Erro ao carregar job ${file}:`, err);
        }
    }
}