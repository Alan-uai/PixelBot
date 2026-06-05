export function canExecute(cmd, message) {
  if (cmd.allowedChannels?.length > 0) {
    if (!cmd.allowedChannels.includes(message.channel.id)) {
      return false;
    }
  }

  if (cmd.allowedRoles?.length > 0) {
    const member = message.member;
    if (!member) return false;
    const hasRole = member.roles.cache.some(role => cmd.allowedRoles.includes(role.id));
    if (!hasRole) return false;
  }

  return true;
}
