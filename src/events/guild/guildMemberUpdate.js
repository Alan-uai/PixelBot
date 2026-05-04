// src/events/guild/guildMemberUpdate.js
import { Events } from 'discord.js';
import axios from 'axios';

async function getRobloxIdFromUsername(username, logger) {
    if (!username) return null;
    try {
        const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
            "usernames": [username],
            "excludeBannedUsers": true
        });
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0].id;
        }
    } catch (error) {
        logger.error(`Erro ao buscar ID do Roblox para o usuário ${username}:`, error.response ? error.response.data : error.message);
    }
    return null;
}

export const name = Events.GuildMemberUpdate;

export async function execute(oldMember, newMember) {
    const { services, config, logger } = newMember.client.container;
    const { supabase } = services;

    const hadVerifiedRole = oldMember.roles.cache.has(config.VERIFIED_ROLE_ID);
    const hasVerifiedRole = newMember.roles.cache.has(config.VERIFIED_ROLE_ID);

    if (!hadVerifiedRole && hasVerifiedRole) {
        logger.info(`Usuário ${newMember.user.tag} recebeu o cargo de verificado. Processando perfil no banco de dados...`);

        const displayName = newMember.displayName;
        const match = displayName.match(/@(\w+)/);
        const robloxUsername = match ? match[1] : null;
        const robloxId = await getRobloxIdFromUsername(robloxUsername, logger);

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', newMember.id)
            .single();

        if (existingUser) {
            if (!existingUser.roblox_id && robloxId) {
                await supabase
                    .from('users')
                    .update({ roblox_id: robloxId })
                    .eq('id', newMember.id);
                logger.info(`ID do Roblox (${robloxId}) adicionado ao perfil existente de ${newMember.user.tag}.`);
            }
        } else {
            await supabase
                .from('users')
                .insert({
                    id: newMember.id,
                    username: newMember.user.username,
                    roblox_id: robloxId,
                    reputation_points: 0,
                    credits: 0,
                });
            logger.info(`Perfil criado automaticamente no DB para o usuário verificado: ${newMember.user.tag} (Roblox ID: ${robloxId || 'não encontrado'})`);
        }
    }
}