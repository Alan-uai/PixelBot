// src/data/wiki-data.js
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '../../data/pixel-blade');

function loadJSON(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (err) {
        console.error(`Error loading ${filename}:`, err.message);
        return null;
    }
}

// Load worlds data
const worldsData = loadJSON('worlds.json');
const worlds = worldsData?.worlds?.list || [];

// Convert worlds to wiki articles format
const worldArticles = worlds.map(world => ({
    id: `world-${world.worldNumber}`,
    title: world.name,
    type: 'world',
    ...world
}));

// Load other game data as separate articles
const gameInfoData = loadJSON('game_info.json');
const bossesData = loadJSON('bosses.json');
const enemiesData = loadJSON('enemies.json');
const weaponsData = loadJSON('weapons.json');
const armorsData = loadJSON('armors.json');
const ringsData = loadJSON('rings.json');
const potionsData = loadJSON('potions.json');
const upgradesData = loadJSON('upgrades.json');
const codesData = loadJSON('codes.json');

// Create additional wiki articles from game data
const additionalArticles = [];

if (gameInfoData) {
    additionalArticles.push({
        id: 'game-info',
        title: 'Game Info',
        type: 'wiki_article',
        ...gameInfoData
    });
}

// Export all wiki articles
export const allWikiArticles = [
    ...worldArticles,
    ...additionalArticles
];
