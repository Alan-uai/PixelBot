export function matchTrigger(message, command, client) {
  if (!command.enabled) return false;

  const content = message.content;
  const prefix = command.prefix || '!';
  const trigger = command.trigger || '';
  const type = command.triggerType || 'exact';

  switch (type) {
    case 'exact':
      return content === trigger || content === `${prefix}${trigger}`;

    case 'startsWith':
      return content.startsWith(trigger) || content.startsWith(`${prefix}${trigger}`);

    case 'includes':
      return content.includes(trigger);

    case 'regex':
      try {
        return new RegExp(trigger, 'i').test(content);
      } catch {
        return false;
      }

    case 'mention':
      if (!message.mentions.has(client.user.id)) return false;
      if (!trigger) return true;
      return content.toLowerCase().includes(trigger.toLowerCase());

    default:
      return false;
  }
}
