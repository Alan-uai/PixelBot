import { createClient } from '@supabase/supabase-js';

let supabaseAnon = null;
let supabaseAdmin = null;

export function initSupabase(config) {
  const url = config.SUPABASE_URL;
  if (!url) {
    console.error('SUPABASE_URL not configured');
    return null;
  }

  const anonKey = config.SUPABASE_ANON_KEY;
  if (anonKey) {
    supabaseAnon = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  const serviceKey = config.SUPABASE_SERVICE_KEY;
  if (serviceKey) {
    supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  if (!supabaseAnon && !supabaseAdmin) {
    console.error('No Supabase key configured (set SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY)');
    return null;
  }

  return supabaseAdmin || supabaseAnon;
}

export function getClient(useAdmin = false) {
  return useAdmin ? (supabaseAdmin || supabaseAnon) : (supabaseAnon || supabaseAdmin);
}

export async function resolveGuildTenant(guildId) {
  const client = getClient(true);
  if (!client) return null;

  const { data: guild, error } = await client
    .from('discord_guilds')
    .select('guild_id, tenant_id, channel_id, bot_enabled')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (error || !guild || !guild.tenant_id) return null;

  const { data: tenant, error: tenantError } = await client
    .from('tenants')
    .select('id, name, slug, description, logo_url, discord_config')
    .eq('id', guild.tenant_id)
    .single();

  if (tenantError || !tenant) return null;

  return {
    ...guild,
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    tenantDescription: tenant.description,
    tenantLogoUrl: tenant.logo_url,
    discordConfig: tenant.discord_config || {},
  };
}

export async function resolveTenant(identifier) {
  const client = getClient(true);
  if (!client) return null;

  const isUuid = identifier.includes('-');
  const query = client.from('tenants').select('*');

  if (isUuid) {
    query.eq('id', identifier);
  } else {
    query.eq('slug', identifier);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function fetchGameTable(tenantId, tableName) {
  const client = getClient(true);
  if (!client) return [];

  const { data, error } = await client
    .from(tableName)
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true });

  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    return [];
  }

  return data || [];
}

export async function fetchAllGameData(tenantId) {
  const client = getClient(true);
  if (!client) return {};

  const tables = ['weapons', 'armors', 'rings', 'potions', 'upgrades', 'worlds', 'enemies', 'bosses', 'codes'];
  const results = {};

  for (const table of tables) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (!error && data) {
      results[table] = data;
    } else {
      results[table] = [];
    }
  }

  const { data: configData, error: configError } = await client
    .from('game_config')
    .select('*')
    .eq('tenant_id', tenantId);

  if (!configError && configData) {
    results.game_config = configData;
  }

  return results;
}

export async function fetchCodes(tenantId) {
  const client = getClient(true);
  if (!client) return [];

  const { data, error } = await client
    .from('codes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching codes:', error.message);
    return [];
  }

  return data || [];
}

export async function getGameData(tableName, searchTerm, tenantId) {
  const client = getClient(true);
  if (!client) return { error: 'Supabase not configured' };

  try {
    let query = client
      .from(tableName)
      .select('*')
      .eq('tenant_id', tenantId);

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { error: `No items found in "${tableName}"${searchTerm ? ` matching "${searchTerm}"` : ''}.` };
    }

    return data;
  } catch (error) {
    console.error('Error fetching game data:', error);
    return { error: 'An error occurred while fetching data from Supabase.' };
  }
}

export { supabaseAnon, supabaseAdmin };
