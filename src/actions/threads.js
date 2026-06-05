import { ChannelType } from 'discord.js';
import { resolveVariables } from '../variables/resolver.js';

export async function create_thread(action, context) {
  const { message, ctx } = context;
  const name = resolveVariables(action.payload?.name || 'new-thread', ctx);
  const channelId = action.payload?.channelId || message.channel.id;
  const isPrivate = action.payload?.type === 'private_thread';

  try {
    const channel = message.guild.channels.cache.get(channelId);
    if (channel?.isTextBased()) {
      await channel.threads.create({
        name,
        type: isPrivate ? ChannelType.PrivateThread : ChannelType.PublicThread,
        reason: 'Comando personalizado',
      });
    }
  } catch {
    // missing permissions
  }
}

export async function delete_thread(action, context) {
  const { message } = context;
  const threadId = action.payload?.threadId || message.channel.id;
  try {
    const thread = message.guild.channels.cache.get(threadId);
    if (thread?.isThread()) await thread.delete();
  } catch {
    // missing permissions
  }
}

export async function archive_thread(action, context) {
  const { message } = context;
  const threadId = action.payload?.threadId || message.channel.id;
  try {
    const thread = message.guild.channels.cache.get(threadId);
    if (thread?.isThread()) await thread.setArchived(true);
  } catch {
    // missing permissions
  }
}

export async function unarchive_thread(action, context) {
  const { message } = context;
  const threadId = action.payload?.threadId || message.channel.id;
  try {
    const thread = message.guild.channels.cache.get(threadId);
    if (thread?.isThread()) await thread.setArchived(false);
  } catch {
    // missing permissions
  }
}

export async function lock_thread(action, context) {
  const { message } = context;
  const threadId = action.payload?.threadId || message.channel.id;
  try {
    const thread = message.guild.channels.cache.get(threadId);
    if (thread?.isThread()) await thread.setLocked(true);
  } catch {
    // missing permissions
  }
}

export async function unlock_thread(action, context) {
  const { message } = context;
  const threadId = action.payload?.threadId || message.channel.id;
  try {
    const thread = message.guild.channels.cache.get(threadId);
    if (thread?.isThread()) await thread.setLocked(false);
  } catch {
    // missing permissions
  }
}

export async function add_thread_member(action, context) {
  const { message, ctx } = context;
  const threadId = action.payload?.threadId || message.channel.id;
  const targetId = action.payload?.userId || ctx.user.id;
  try {
    const thread = message.guild.channels.cache.get(threadId);
    if (thread?.isThread()) await thread.members.add(targetId);
  } catch {
    // missing permissions
  }
}

export async function remove_thread_member(action, context) {
  const { message } = context;
  const threadId = action.payload?.threadId || message.channel.id;
  const targetId = action.payload?.userId;
  if (!targetId) return;
  try {
    const thread = message.guild.channels.cache.get(threadId);
    if (thread?.isThread()) await thread.members.remove(targetId);
  } catch {
    // missing permissions
  }
}
