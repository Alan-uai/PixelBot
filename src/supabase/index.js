// src/supabase/index.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key not found in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function getGameData(worldName, category, itemName) {
  try {
    let query = supabase.from('worlds').select('*');
    
    if (worldName) {
      query = query.ilike('name', `%${worldName}%`);
    }
    
    const { data: worlds, error: worldError } = await query;
    
    if (worldError) throw worldError;
    
    if (!worlds || worlds.length === 0) {
      return { error: `Could not find any worlds.` };
    }
    
    const results = [];
    const searchName = itemName ? itemName.toLowerCase().replace(/ /g, '-') : null;
    
    for (const world of worlds) {
      let itemsQuery = supabase.from(category).select('*').eq('world_id', world.id);
      
      if (searchName) {
        itemsQuery = itemsQuery.or(`name.ilike.%${searchName}%,id.ilike.%${searchName}%`);
      }
      
      const { data: items, error: itemsError } = await itemsQuery;
      
      if (itemsError) continue;
      
      if (items && items.length > 0) {
        for (const item of items) {
          const itemData = {
            id: item.id,
            world: world.name,
            ...item
          };
          
          if (category === 'powers' && item.id) {
            const { data: stats } = await supabase
              .from('power_stats')
              .select('*')
              .eq('power_id', item.id)
              .order('multiplier', { ascending: true });
            
            if (stats) {
              itemData.stats = stats;
            }
          }
          
          results.push(itemData);
        }
      }
    }
    
    if (results.length === 0) {
      return { error: `No items found in category "${category}" ${itemName ? `with name containing "${itemName}"` : ''} in any searched world.` };
    }
    
    return results;
    
  } catch (error) {
    console.error('Error fetching game data:', error);
    return { error: 'An error occurred while fetching data from Supabase.' };
  }
}

export async function getUpdateLog() {
  try {
    const { data, error } = await supabase
      .from('bot_config')
      .select('value')
      .eq('key', 'latestUpdateLog')
      .single();
    
    if (error || !data) {
      return { error: 'Nenhum log de atualização encontrado.' };
    }
    
    return data.value;
  } catch (error) {
    console.error('Error fetching update log:', error);
    return { error: 'An error occurred while fetching the update log.' };
  }
}
