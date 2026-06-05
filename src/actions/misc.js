import { resolveVariables } from '../variables/resolver.js';

export async function create_invite(action, context) {
  const { message } = context;
  const channelId = action.payload?.channelId || message.channel.id;
  const maxAge = action.payload?.maxAge ?? 86400;
  const maxUses = action.payload?.maxUses || undefined;
  try {
    const channel = message.guild.channels.cache.get(channelId);
    if (channel?.isTextBased()) {
      await channel.createInvite({ maxAge, maxUses, reason: 'Comando personalizado' });
    }
  } catch {
    // missing permissions
  }
}

export async function set_bot_status(action, context) {
  const { client } = context;
  const status = action.payload?.status || 'online';
  const activityName = action.payload?.activityName;
  const activityType = action.payload?.activityType || 0; // 0=Playing, 1=Streaming, 2=Listening, 3=Watching, 5=Competing

  try {
    client.user.setStatus(status);

    if (activityName) {
      client.user.setActivity(resolveVariables(activityName, context.ctx), { type: activityType });
    }
  } catch {
    // may fail silently
  }
}
