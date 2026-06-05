import fs from 'node:fs';
import path from 'node:path';
import { fetchAllGameData } from '../supabase/index.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const DATA_DIR = path.join(__dirname, '../../data/pixel-blade');

function loadJSON(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (err) {
        return null;
    }
}

function buildWorldArticles(supabaseWorlds) {
    return supabaseWorlds.map(world => ({
        id: `world-${world.world_number ?? 0}`,
        title: world.name || world.world_name || `World ${world.world_number}`,
        type: 'world',
        worldNumber: world.world_number ?? 0,
        summary: world.description || '',
        description: world.description || '',
        environment: world.environment || '',
        status: world.status || '',
        chapters: world.chapters || [],
        difficulties: world.difficulties || [],
        features: world.features || [],
        enemies: world.enemies || [],
        bosses: world.bosses || [],
        notableLoot: world.notable_loot || [],
        tips: world.tips || '',
        warning: world.warning || '',
        npcs: [],
        pets: [],
        powers: [],
        accessories: [],
        dungeons: [],
        shadows: [],
        stands: [],
        ghouls: [],
        obelisks: [],
        missions: [],
        dailyQuests: [],
    }));
}

function buildArticleFromItems(tableName, items, metadata = {}) {
    const labelMap = {
        weapons: 'Weapons',
        armors: 'Armors',
        rings: 'Rings',
        potions: 'Potions',
        upgrades: 'Upgrades',
        enemies: 'Enemies',
        bosses: 'Bosses',
        codes: 'Codes',
    };

    const title = labelMap[tableName] || tableName.charAt(0).toUpperCase() + tableName.slice(1);
    const list = items.map(item => ({
        name: item.name || item.code || '',
        rarity: item.rarity || '',
        tier: item.tier || '',
        description: item.description || '',
        ...item,
    }));

    return {
        id: `game-${tableName}`,
        title,
        type: 'wiki_article',
        summary: metadata.summary || `${title} information and data.`,
        list,
        metadata,
    };
}

export async function loadWikiArticles(supabase, tenantId) {
    if (!supabase || !tenantId) {
        return loadFromJsonFallback();
    }

    const gameData = await fetchAllGameData(tenantId);
    const hasSupabaseData = Object.values(gameData).some(arr => Array.isArray(arr) && arr.length > 0);

    if (hasSupabaseData) {
        const articles = [];

        if (gameData.worlds?.length) {
            articles.push(...buildWorldArticles(gameData.worlds));
        }

        const articleTables = ['weapons', 'armors', 'rings', 'potions', 'upgrades', 'enemies', 'bosses'];
        for (const table of articleTables) {
            if (gameData[table]?.length) {
                articles.push(buildArticleFromItems(table, gameData[table]));
            }
        }

        if (gameData.codes?.length) {
            const activeCodes = gameData.codes.filter(c => c.is_active !== false && !c.is_expired);
            articles.push(buildArticleFromItems('codes', activeCodes, {
                summary: 'Active game codes that can be redeemed for rewards.',
            }));
        }

        if (gameData.game_config?.length) {
            const configMap = {};
            for (const row of gameData.game_config) {
                configMap[row.config_key || row.name] = row.config_value || row;
            }
            articles.push({
                id: 'game-info',
                title: 'Game Info',
                type: 'wiki_article',
                summary: 'General game information including mechanics, stats, controls, and systems.',
                gameConfig: configMap,
            });
        }

        return articles;
    }

    return loadFromJsonFallback();
}

function loadFromJsonFallback() {
    const worldsData = loadJSON('worlds.json');
    const worlds = worldsData?.worlds?.list || [];
    const worldArticles = worlds.map(world => ({
        id: `world-${world.worldNumber}`,
        title: world.name,
        type: 'world',
        ...world,
    }));

    const articles = [...worldArticles];

    const gameInfoData = loadJSON('game_info.json');
    if (gameInfoData) {
        articles.push({
            id: 'game-info',
            title: 'Game Info',
            type: 'wiki_article',
            ...gameInfoData,
        });
    }

    const fallbackTables = ['weapons', 'armors', 'rings', 'potions', 'upgrades', 'enemies', 'bosses'];
    for (const table of fallbackTables) {
        const data = loadJSON(`${table}.json`);
        if (data) {
            const listKey = Object.keys(data).find(k => data[k]?.list);
            const items = listKey ? data[listKey].list || [] : [];
            articles.push({
                id: `game-${table}`,
                title: table.charAt(0).toUpperCase() + table.slice(1),
                type: 'wiki_article',
                data: data[listKey] || data,
                list: items,
            });
        }
    }

    const codesData = loadJSON('codes.json');
    if (codesData) {
        const activeCodes = codesData.codes?.activeCodes || [];
        articles.push({
            id: 'game-codes',
            title: 'Codes',
            type: 'wiki_article',
            summary: 'Active game codes that can be redeemed for rewards.',
            list: activeCodes,
            data: codesData.codes,
        });
    }

    return articles;
}
