import { WebhookClient } from 'discord.js';
import { buildEmbed } from './embeds.js';
import { resolveVariables } from '../variables/resolver.js';

export async function create_webhook(action, context) {
  const { message, ctx } = context;
  const name = resolveVariables(action.payload?.name || 'webhook', ctx);
  const channelId = action.payload?.channelId || message.channel.id;

  try {
    const channel = message.guild.channels.cache.get(channelId);
    if (channel?.isTextBased()) {
      await channel.createWebhook({ name, reason: 'Comando personalizado' });
    }
  } catch {
    // missing permissions
  }
}

export async function execute_webhook(action, context) {
  const { ctx } = context;
  const id = action.payload?.webhookId;
  const token = action.payload?.webhookToken;
  if (!id || !token) return;

  try {
    const webhook = new WebhookClient({ id, token });
    await webhook.send({
      content: action.payload?.content ? resolveVariables(action.payload.content, ctx) : undefined,
      embeds: action.payload?.embeds?.map(e => buildEmbed(e, ctx)).filter(Boolean) || [],
    });
  } catch {
    // invalid webhook
  }
}

export async function delete_webhook(action) {
  const id = action.payload?.webhookId;
  const token = action.payload?.webhookToken;
  if (!id || !token) return;

  try {
    const webhook = new WebhookClient({ id, token });
    await webhook.delete();
  } catch {
    // invalid webhook
  }
}
