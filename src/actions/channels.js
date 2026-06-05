import { ChannelType } from 'discord.js';
import { resolveVariables } from '../variables/resolver.js';

const channelTypeMap = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  forum: ChannelType.GuildForum,
  announcement: ChannelType.GuildAnnouncement,
  stage: ChannelType.GuildStageVoice,
  category: ChannelType.GuildCategory,
};

export async function create_channel(action, context) {
  const { message, ctx } = context;
  const name = resolveVariables(action.payload?.name || 'new-channel', ctx);
  const type = channelTypeMap[action.payload?.type] || ChannelType.GuildText;
  try {
    await message.guild.channels.create({
      name,
      type,
      parent: action.payload?.parentId || undefined,
      topic: action.payload?.topic ? resolveVariables(action.payload.topic, ctx) : undefined,
    });
  } catch {
    // missing permissions
  }
}

export async function delete_channel(action, context) {
  const { message } = context;
  const channelId = action.payload?.channelId;
  if (!channelId) return;
  try {
    const channel = message.guild.channels.cache.get(channelId);
    if (channel) await channel.delete('Comando personalizado');
  } catch {
    // missing permissions
  }
}

export async function edit_channel(action, context) {
  const { message, ctx } = context;
  const channelId = action.payload?.channelId;
  if (!channelId) return;
  try {
    const channel = message.guild.channels.cache.get(channelId);
    if (!channel) return;
    const editData = {};
    if (action.payload?.name) editData.name = resolveVariables(action.payload.name, ctx);
    if (action.payload?.topic) editData.topic = resolveVariables(action.payload.topic, ctx);
    await channel.edit(editData);
  } catch {
    // missing permissions
  }
}
