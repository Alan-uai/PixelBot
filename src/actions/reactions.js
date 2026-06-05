export async function add_reaction(action, context) {
  const { message } = context;
  const emoji = action.payload?.emoji;
  if (!emoji) return;
  try {
    await message.react(emoji);
  } catch {
    // invalid emoji or missing permissions
  }
}

export async function remove_reaction(action, context) {
  const { message } = context;
  const emoji = action.payload?.emoji;
  if (!emoji) return;
  try {
    const reactions = message.reactions.cache;
    const reaction = reactions.find(r => r.emoji.toString() === emoji || r.emoji.name === emoji);
    if (reaction) {
      await reaction.remove();
    }
  } catch {
    // missing permissions
  }
}

export async function clear_reactions(action, context) {
  const { message } = context;
  try {
    await message.reactions.removeAll();
  } catch {
    // missing permissions
  }
}
