import { GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } from 'discord.js';
import { resolveVariables } from '../variables/resolver.js';

const entityTypeMap = {
  stage: GuildScheduledEventEntityType.StageInstance,
  voice: GuildScheduledEventEntityType.Voice,
  external: GuildScheduledEventEntityType.External,
};

export async function create_event(action, context) {
  const { message, ctx } = context;
  const name = resolveVariables(action.payload?.name || 'Event', ctx);
  const description = action.payload?.description ? resolveVariables(action.payload.description, ctx) : undefined;

  try {
    await message.guild.scheduledEvents.create({
      name,
      description,
      scheduledStartTime: new Date(action.payload?.scheduledStart),
      scheduledEndTime: action.payload?.scheduledEnd ? new Date(action.payload.scheduledEnd) : undefined,
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      entityType: entityTypeMap[action.payload?.entityType] || GuildScheduledEventEntityType.Voice,
      channel: action.payload?.channelId ? message.guild.channels.cache.get(action.payload.channelId) : undefined,
    });
  } catch {
    // missing permissions or invalid data
  }
}

export async function delete_event(action, context) {
  const { message } = context;
  const eventId = action.payload?.eventId;
  if (!eventId) return;
  try {
    const event = message.guild.scheduledEvents.cache.get(eventId);
    if (event) await event.delete();
  } catch {
    // missing permissions
  }
}

export async function edit_event(action, context) {
  const { message, ctx } = context;
  const eventId = action.payload?.eventId;
  if (!eventId) return;
  try {
    const event = message.guild.scheduledEvents.cache.get(eventId);
    if (!event) return;
    const editData = {};
    if (action.payload?.name) editData.name = resolveVariables(action.payload.name, ctx);
    if (action.payload?.description) editData.description = resolveVariables(action.payload.description, ctx);
    await event.edit(editData);
  } catch {
    // missing permissions
  }
}
