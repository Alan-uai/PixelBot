import { resolveVariables } from '../variables/resolver.js';

export async function create_emoji(action, context) {
  const { message, ctx } = context;
  const name = resolveVariables(action.payload?.name || 'new_emoji', ctx);
  const imageUrl = action.payload?.imageUrl || action.payload?.url;
  if (!imageUrl) return;
  try {
    await message.guild.emojis.create({ attachment: imageUrl, name, reason: 'Comando personalizado' });
  } catch {
    // missing permissions
  }
}

export async function delete_emoji(action, context) {
  const { message } = context;
  const emojiId = action.payload?.emojiId;
  if (!emojiId) return;
  try {
    const emoji = message.guild.emojis.cache.get(emojiId);
    if (emoji) await emoji.delete();
  } catch {
    // missing permissions
  }
}
