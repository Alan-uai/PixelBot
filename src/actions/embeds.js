import { EmbedBuilder } from 'discord.js';
import { resolveVariables } from '../variables/resolver.js';

export function buildEmbed(payload, ctx) {
  if (!payload) return null;

  const embed = new EmbedBuilder();

  if (payload.title) embed.setTitle(resolveVariables(payload.title, ctx));
  if (payload.description) embed.setDescription(resolveVariables(payload.description, ctx));
  if (payload.color) embed.setColor(typeof payload.color === 'string' ? parseInt(payload.color.replace('#', ''), 16) : payload.color);
  if (payload.url) embed.setURL(payload.url);
  if (payload.timestamp) embed.setTimestamp(payload.timestamp === true ? new Date() : new Date(payload.timestamp));
  if (payload.footer) {
    embed.setFooter({
      text: resolveVariables(payload.footer.text, ctx),
      iconURL: payload.footer.icon_url ? resolveVariables(payload.footer.icon_url, ctx) : undefined,
    });
  }
  if (payload.image?.url) embed.setImage(resolveVariables(payload.image.url, ctx));
  if (payload.thumbnail?.url) embed.setThumbnail(resolveVariables(payload.thumbnail.url, ctx));
  if (payload.author) {
    embed.setAuthor({
      name: resolveVariables(payload.author.name, ctx),
      iconURL: payload.author.icon_url ? resolveVariables(payload.author.icon_url, ctx) : undefined,
      url: payload.author.url ? resolveVariables(payload.author.url, ctx) : undefined,
    });
  }
  if (payload.fields) {
    embed.addFields(
      payload.fields.map(f => ({
        name: resolveVariables(f.name, ctx),
        value: resolveVariables(f.value, ctx),
        inline: f.inline || false,
      }))
    );
  }

  return embed;
}
