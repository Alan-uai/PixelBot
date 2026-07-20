function formatValue(value, indentLevel = 0) {
    const indent = '  '.repeat(indentLevel);
    if (Array.isArray(value)) {
        return value.map(item => `${indent}- ${formatValue(item, indentLevel + 1)}`).join('\n');
    }
    if (typeof value === 'object' && value !== null) {
        return Object.entries(value)
            .map(([key, val]) => `${indent}${key}: ${formatValue(val, indentLevel + 1)}`)
            .join('\n');
    }
    return String(value);
}

function formatArticle(article) {
    let content = `INÍCIO DO ARTIGO: ${article.title}\n`;
    content += `RESUMO: ${article.summary}\n`;

    if (article.content) {
        content += `CONTEÚDO:\n${article.content}\n\n`;
    }

    const excludedKeys = ['id', 'title', 'summary', 'content', 'type', 'worldId', 'subCollections'];

    for (const key in article) {
        if (excludedKeys.includes(key)) continue;

        const value = article[key];
        content += `SEÇÃO: ${key.toUpperCase()}\n`;
        content += `${formatValue(value, 1)}\n\n`;
    }

    if (article.subCollections) {
        for (const [collectionName, items] of Object.entries(article.subCollections)) {
            content += `SEÇÃO: ${collectionName.toUpperCase()}\n`;
            items.forEach(item => {
                const itemName = item.name || item.id;
                content += `- **${itemName}**:\n`;
                for (const prop in item) {
                    if (prop === 'id' || prop === 'name') continue;
                    const propValue = item[prop];
                    if (propValue !== undefined && propValue !== null) {
                        content += `  - ${prop}: ${formatValue(propValue, 2)}\n`;
                    }
                }
            });
            content += '\n';
        }
    }

    content += 'FIM DO ARTIGO\n';
    return content;
}

export class WikiService {
    constructor(dataCompiler, logger) {
        this.logger = logger;
        this.dataCompiler = dataCompiler;
        this.contextCache = new Map();
    }

    async getContext(tenantId) {
        if (!tenantId) {
            this.logger.warn('[WikiService] tenantId não fornecido, usando fallback JSON.');
        }

        if (tenantId && this.contextCache.has(tenantId)) {
            return this.contextCache.get(tenantId);
        }

        this.logger.info(`[WikiService] Compilando base de conhecimento para tenant ${tenantId}...`);
        const compiledData = await this.dataCompiler.getCompiledData(tenantId);
        const knowledgeContext = compiledData.map(formatArticle).join('\n---\n');

        this.contextCache.set(tenantId, knowledgeContext);
        this.logger.info(`[WikiService] Base de conhecimento para tenant ${tenantId} compilada.`);
        return knowledgeContext;
    }

    invalidateCache(tenantId) {
        if (tenantId) {
            this.contextCache.delete(tenantId);
            this.dataCompiler.invalidateCache(tenantId);
        } else {
            this.contextCache.clear();
            this.dataCompiler.invalidateCache();
        }
    }
}
