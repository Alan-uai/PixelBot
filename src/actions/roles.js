import { resolveVariables } from '../variables/resolver.js';

export async function add_role(action, context) {
  const { message, ctx } = context;
  const targetId = action.payload?.userId || ctx.user.id;
  const roleId = action.payload?.roleId;
  if (!roleId) return;
  try {
    const member = await message.guild.members.fetch(targetId);
    const role = message.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role);
  } catch {
    // missing permissions
  }
}

export async function remove_role(action, context) {
  const { message, ctx } = context;
  const targetId = action.payload?.userId || ctx.user.id;
  const roleId = action.payload?.roleId;
  if (!roleId) return;
  try {
    const member = await message.guild.members.fetch(targetId);
    const role = message.guild.roles.cache.get(roleId);
    if (role) await member.roles.remove(role);
  } catch {
    // missing permissions
  }
}

export async function create_role(action, context) {
  const { message, ctx } = context;
  const name = resolveVariables(action.payload?.name || 'new-role', ctx);
  try {
    await message.guild.roles.create({
      name,
      color: action.payload?.color,
      permissions: action.payload?.permissions,
      reason: 'Comando personalizado',
    });
  } catch {
    // missing permissions
  }
}

export async function delete_role(action, context) {
  const { message } = context;
  const roleId = action.payload?.roleId;
  if (!roleId) return;
  try {
    const role = message.guild.roles.cache.get(roleId);
    if (role) await role.delete('Comando personalizado');
  } catch {
    // missing permissions
  }
}

export async function edit_role(action, context) {
  const { message, ctx } = context;
  const roleId = action.payload?.roleId;
  if (!roleId) return;
  try {
    const role = message.guild.roles.cache.get(roleId);
    if (!role) return;
    const editData = {};
    if (action.payload?.name) editData.name = resolveVariables(action.payload.name, ctx);
    if (action.payload?.color) editData.color = action.payload.color;
    if (action.payload?.hoist !== undefined) editData.hoist = action.payload.hoist;
    if (action.payload?.mentionable !== undefined) editData.mentionable = action.payload.mentionable;
    await role.edit(editData);
  } catch {
    // missing permissions
  }
}
