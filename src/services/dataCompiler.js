import { loadWikiArticles } from '../data/wiki-data.js';

function normalizeId(name) {
    if (!name) return null;
    return name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

export class DataCompilerService {
    constructor({ supabase, logger }) {
        this.logger = logger;
        this.supabase = supabase;
        this.cache = new Map();
    }

    async getCompiledData(tenantId) {
        if (!tenantId) {
            this.logger.warn('[DataCompiler] tenantId não fornecido, usando fallback JSON');
            const articles = await loadWikiArticles(null, null);
            return this.processArticles(articles);
        }

        if (this.cache.has(tenantId)) {
            return this.cache.get(tenantId);
        }

        this.logger.info(`[DataCompiler] Compilando dados do tenant ${tenantId}...`);
        const articles = await loadWikiArticles(this.supabase, tenantId);
        const compiled = this.processArticles(articles);

        this.cache.set(tenantId, compiled);
        this.logger.info(`[DataCompiler] ${compiled.length} artigos compilados para tenant ${tenantId}.`);
        return compiled;
    }

    invalidateCache(tenantId) {
        if (tenantId) {
            this.cache.delete(tenantId);
        } else {
            this.cache.clear();
        }
    }

    processArticles(articles) {
        return articles.map(article => {
            const processedArticle = { ...article };

            if (article.id && article.id.startsWith('world-')) {
                processedArticle.type = 'world';

                const subCollectionKeys = ['npcs', 'pets', 'powers', 'accessories', 'dungeons', 'shadows', 'stands', 'ghouls', 'obelisks', 'missions', 'dailyQuests'];
                const subCollections = {};

                for (const key of subCollectionKeys) {
                    if (Array.isArray(processedArticle[key])) {
                        subCollections[key] = processedArticle[key].map(item => {
                            const newItem = { ...item };
                            newItem.id = normalizeId(item.id || item.name);
                            return newItem;
                        });
                        delete processedArticle[key];
                    }
                }
                processedArticle.subCollections = subCollections;
            } else {
                processedArticle.type = 'wiki_article';
            }

            return processedArticle;
        });
    }
}
