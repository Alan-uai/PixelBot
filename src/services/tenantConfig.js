import { fetchGameTable } from '../supabase/index.js';

export class TenantConfigService {
  constructor({ supabase, getClient, config, logger }) {
    this.supabase = supabase;
    this.getClient = getClient;
    this.config = config;
    this.logger = logger;
    this.guildConfigs = new Map();
    this.realtimeChannel = null;
  }

  async initialize() {
    this.logger.info('[TenantConfig] Carregando configurações dos servidores...');
    await this.loadAllConfigs();
    this.logger.info(`[TenantConfig] ${this.guildConfigs.size} servidores configurados.`);
  }

  async loadAllConfigs() {
    const client = this.getClient(true);
    if (!client) return;

    const { data: guilds, error } = await client
      .from('discord_guilds')
      .select('guild_id, tenant_id, channel_id, bot_enabled')
      .eq('bot_enabled', true);

    if (error) {
      this.logger.error('[TenantConfig] Erro ao carregar discord_guilds:', error.message);
      return;
    }

    if (!guilds?.length) return;

    for (const guild of guilds) {
      if (!guild.tenant_id) continue;

      const { data: tenant, error: tenantError } = await client
        .from('tenants')
        .select('name, slug, discord_config')
        .eq('id', guild.tenant_id)
        .single();

      if (tenantError || !tenant) continue;

      this.guildConfigs.set(guild.guild_id, {
        guildId: guild.guild_id,
        tenantId: guild.tenant_id,
        channelId: guild.channel_id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        ...(tenant.discord_config || {}),
      });
    }
  }

  get(guildId) {
    return this.guildConfigs.get(guildId) || null;
  }

  has(guildId) {
    return this.guildConfigs.has(guildId);
  }

  set(guildId, config) {
    this.guildConfigs.set(guildId, config);
  }

  delete(guildId) {
    this.guildConfigs.delete(guildId);
  }

  async applyGuildConfig(guild, guildConfig) {
    if (!guildConfig) return;

    try {
      if (guildConfig.bot_name) {
        const me = guild.members.me;
        if (me && me.nickname !== guildConfig.bot_name) {
          await me.setNickname(guildConfig.bot_name);
        }
      }

      if (guildConfig.status && guildConfig.status !== 'online') {
        const client = guild.client;
        if (client.user) {
          await client.user.setStatus(guildConfig.status);
        }
      }
    } catch (error) {
      this.logger.warn(`[TenantConfig] Erro ao aplicar config na guild ${guild.id}: ${error.message}`);
    }
  }

  subscribeToRealtime(client) {
    const supabaseClient = this.getClient(true);
    if (!supabaseClient) return;

    try {
      this.realtimeChannel = supabaseClient
        .channel('discord-config-changes')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tenants',
            filter: 'discord_config=neq.' + JSON.stringify(null),
          },
          async (payload) => {
            this.logger.info('[TenantConfig] Mudança detectada em tenants.discord_config');

            const { data: guilds, error } = await supabaseClient
              .from('discord_guilds')
              .select('guild_id')
              .eq('tenant_id', payload.new.id);

            if (error || !guilds) return;

            const tenantSlug = payload.new.slug;
            const tenantName = payload.new.name;
            const discordConfig = payload.new.discord_config || {};

            for (const g of guilds) {
              const existing = this.guildConfigs.get(g.guild_id) || {};
              this.guildConfigs.set(g.guild_id, {
                ...existing,
                guildId: g.guild_id,
                tenantId: payload.new.id,
                tenantName,
                tenantSlug,
                ...discordConfig,
              });

              const discordGuild = client.guilds.cache.get(g.guild_id);
              if (discordGuild) {
                await this.applyGuildConfig(discordGuild, discordConfig);
              }
            }

            this.logger.info(`[TenantConfig] Config recarregada para tenant ${tenantName} (${guilds.length} guilds)`);
          }
        )
        .subscribe();

      this.logger.info('[TenantConfig] Inscrição Realtime para discord_config ativa.');
    } catch (error) {
      this.logger.error('[TenantConfig] Erro ao inscrever no Realtime:', error.message);
    }
  }

  unsubscribe() {
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}
