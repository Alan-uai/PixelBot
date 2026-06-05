import { resolveVariables } from '../variables/resolver.js';

export async function kick_member(action, context) {
  const { message, ctx } = context;
  const targetId = action.payload?.userId || ctx.user.id;
  const reason = resolveVariables(action.payload?.reason || '', ctx);
  try {
    const member = await message.guild.members.fetch(targetId);
    await member.kick(reason || undefined);
  } catch {
    // missing permissions
  }
}

export async function ban_member(action, context) {
  const { message, ctx } = context;
  const targetId = action.payload?.userId || ctx.user.id;
  const reason = resolveVariables(action.payload?.reason || '', ctx);
  const deleteDays = action.payload?.deleteMessageDays || 0;
  try {
    await message.guild.members.ban(targetId, { reason: reason || undefined, deleteMessageDays: deleteDays });
  } catch {
    // missing permissions
  }
}

export async function unban_member(action, context) {
  const { message, ctx } = context;
  const targetId = action.payload?.userId || ctx.user.id;
  try {
    await message.guild.members.unban(targetId);
  } catch {
    // missing permissions
  }
}

export async function timeout_member(action, context) {
  const { message, ctx } = context;
  const targetId = action.payload?.userId || ctx.user.id;
  const duration = action.payload?.duration || 60;
  const reason = resolveVariables(action.payload?.reason || '', ctx);
  try {
    const member = await message.guild.members.fetch(targetId);
    await member.timeout(duration * 1000, reason || undefined);
  } catch {
    // missing permissions
  }
}

export async function move_member(action, context) {
  const { message } = context;
  const targetId = action.payload?.userId;
  const channelId = action.payload?.channelId;
  if (!targetId || !channelId) return;
  try {
    const member = await message.guild.members.fetch(targetId);
    const channel = message.guild.channels.cache.get(channelId);
    if (channel?.isVoiceBased()) {
      await member.voice.setChannel(channel);
    }
  } catch {
    // missing permissions or user not in voice
  }
}

export async function mute_member(action, context) {
  const { message } = context;
  const targetId = action.payload?.userId;
  if (!targetId) return;
  try {
    const member = await message.guild.members.fetch(targetId);
    if (member.voice.channel) {
      await member.voice.setMute(true);
    }
  } catch {
    // missing permissions
  }
}

export async function deafen_member(action, context) {
  const { message } = context;
  const targetId = action.payload?.userId;
  if (!targetId) return;
  try {
    const member = await message.guild.members.fetch(targetId);
    if (member.voice.channel) {
      await member.voice.setDeaf(true);
    }
  } catch {
    // missing permissions
  }
}

export async function disconnect_member(action, context) {
  const { message } = context;
  const targetId = action.payload?.userId;
  if (!targetId) return;
  try {
    const member = await message.guild.members.fetch(targetId);
    if (member.voice.channel) {
      await member.voice.disconnect();
    }
  } catch {
    // missing permissions
  }
}
