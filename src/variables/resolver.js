export function resolveVariables(text, ctx) {
  if (!text || typeof text !== 'string') return text;

  return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const parts = path.split('.');
    let value = ctx;

    for (const part of parts) {
      if (value == null || typeof value !== 'object') return match;
      value = value[part];
    }

    if (value == null) return match;
    if (typeof value === 'function') return match;
    return String(value);
  });
}

export function buildVariableContext(message, client, guildConfig, extra = {}) {
  const member = message.member;
  const guild = message.guild;
  const channel = message.channel;

  const now = new Date();

  const ctx = {
    user: {
      id: message.author.id,
      username: message.author.username,
      displayName: member?.displayName || message.author.username,
      discriminator: message.author.discriminator,
      avatarURL: message.author.displayAvatarURL(),
      mention: `<@${message.author.id}>`,
      tag: message.author.tag,
      createdAt: message.author.createdAt?.toISOString(),
      joinedAt: member?.joinedAt?.toISOString(),
      bot: message.author.bot,
      roles: member?.roles?.cache?.map(r => ({ id: r.id, name: r.name, mention: r.toString() })) || [],
    },
    guild: {
      id: guild.id,
      name: guild.name,
      iconURL: guild.iconURL(),
      memberCount: guild.memberCount,
      ownerId: guild.ownerId,
      createdAt: guild.createdAt?.toISOString(),
      description: guild.description,
      premiumTier: guild.premiumTier,
    },
    channel: {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      topic: channel.topic,
      parentId: channel.parentId,
      createdAt: channel.createdAt?.toISOString(),
    },
    message: {
      id: message.id,
      content: message.content,
      cleanContent: message.cleanContent,
      url: message.url,
      createdAt: message.createdAt?.toISOString(),
      editedAt: message.editedAt?.toISOString(),
      attachments: message.attachments?.map(a => ({ url: a.url, name: a.name, size: a.size })),
      hasImage: message.attachments?.some(a => a.contentType?.startsWith('image/')),
    },
    timestamp: {
      now: now.toISOString(),
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR'),
      datetime: now.toLocaleString('pt-BR'),
      timestamp: Math.floor(now.getTime() / 1000),
      unix: Math.floor(now.getTime() / 1000),
      relative: `<t:${Math.floor(now.getTime() / 1000)}:R>`,
    },
    bot: {
      id: client.user.id,
      username: client.user.username,
      avatarURL: client.user.displayAvatarURL(),
      mention: `<@${client.user.id}>`,
      uptime: Math.floor(process.uptime()),
      ping: client.ws.ping,
    },
    ...extra,
  };

  return ctx;
}
