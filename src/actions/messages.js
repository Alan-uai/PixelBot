import { buildEmbed } from './embeds.js';
import { resolveVariables } from '../variables/resolver.js';

export async function send_message(action, context) {
  const { message, ctx } = context;
  const content = resolveVariables(action.payload?.content, ctx);
  const embeds = action.payload?.embeds?.map(e => buildEmbed(e, ctx)).filter(Boolean) || [];

  const reply = await message.channel.send({
    content: content || undefined,
    embeds,
  });
  return reply;
}

export async function edit_message(action, context) {
  const { message, ctx } = context;
  const content = resolveVariables(action.payload?.content, ctx);
  const embeds = action.payload?.embeds?.map(e => buildEmbed(e, ctx)).filter(Boolean) || [];

  try {
    await message.edit({
      content: content || undefined,
      embeds,
    });
  } catch {
    // message may be too old to edit
  }
}

export async function delete_message(action, context) {
  const { message } = context;
  try {
    await message.delete();
  } catch {
    // may lack permissions
  }
}

export async function pin_message(action, context) {
  const { message } = context;
  try {
    await message.pin();
  } catch {
    // may lack permissions
  }
}

export async function unpin_message(action, context) {
  const { message } = context;
  try {
    await message.unpin();
  } catch {
    // may lack permissions
  }
}

export async function crosspost_message(action, context) {
  const { message } = context;
  try {
    await message.crosspost();
  } catch {
    // may lack permissions
  }
}

export async function send_dm(action, context) {
  const { message, ctx } = context;
  const content = resolveVariables(action.payload?.content, ctx);

  try {
    await message.author.send({
      content: content || undefined,
    });
  } catch {
    // user may have DMs disabled
  }
}
