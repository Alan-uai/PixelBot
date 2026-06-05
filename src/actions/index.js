import * as messages from './messages.js';
import * as reactions from './reactions.js';
import * as channels from './channels.js';
import * as members from './members.js';
import * as roles from './roles.js';
import * as threads from './threads.js';
import * as webhooks from './webhooks.js';
import * as events from './events.js';
import * as emojis from './emojis.js';
import * as misc from './misc.js';

const actionHandlers = {
  send_message: messages.send_message,
  edit_message: messages.edit_message,
  delete_message: messages.delete_message,
  pin_message: messages.pin_message,
  unpin_message: messages.unpin_message,
  crosspost_message: messages.crosspost_message,
  send_dm: messages.send_dm,

  add_reaction: reactions.add_reaction,
  remove_reaction: reactions.remove_reaction,
  clear_reactions: reactions.clear_reactions,

  create_channel: channels.create_channel,
  delete_channel: channels.delete_channel,
  edit_channel: channels.edit_channel,

  kick_member: members.kick_member,
  ban_member: members.ban_member,
  unban_member: members.unban_member,
  timeout_member: members.timeout_member,
  move_member: members.move_member,
  mute_member: members.mute_member,
  deafen_member: members.deafen_member,
  disconnect_member: members.disconnect_member,

  add_role: roles.add_role,
  remove_role: roles.remove_role,
  create_role: roles.create_role,
  delete_role: roles.delete_role,
  edit_role: roles.edit_role,

  create_thread: threads.create_thread,
  delete_thread: threads.delete_thread,
  archive_thread: threads.archive_thread,
  unarchive_thread: threads.unarchive_thread,
  lock_thread: threads.lock_thread,
  unlock_thread: threads.unlock_thread,
  add_thread_member: threads.add_thread_member,
  remove_thread_member: threads.remove_thread_member,

  create_webhook: webhooks.create_webhook,
  execute_webhook: webhooks.execute_webhook,
  delete_webhook: webhooks.delete_webhook,

  create_event: events.create_event,
  delete_event: events.delete_event,
  edit_event: events.edit_event,

  create_emoji: emojis.create_emoji,
  delete_emoji: emojis.delete_emoji,

  create_invite: misc.create_invite,
  set_bot_status: misc.set_bot_status,
};

export { actionHandlers };

const delayMap = new Map();

export async function executeActions(actions, context, mode = 'sequential') {
  if (!actions?.length) return [];

  if (mode === 'parallel') {
    const results = await Promise.allSettled(
      actions.map((action, index) =>
        executeSingleAction(action, context, index)
      )
    );
    return results;
  }

  const results = [];
  for (let i = 0; i < actions.length; i++) {
    const result = await executeSingleAction(actions[i], context, i);
    results.push(result);

    if (actions[i].delay) {
      await sleep(actions[i].delay);
    }
  }
  return results;
}

async function executeSingleAction(action, context, index) {
  const handler = actionHandlers[action.type];
  if (!handler) {
    console.warn(`Unknown action type: ${action.type}`);
    return { type: action.type, status: 'unknown', index };
  }

  try {
    await handler(action, context);
    return { type: action.type, status: 'success', index };
  } catch (error) {
    console.error(`Action ${action.type} failed:`, error);
    return { type: action.type, status: 'error', error: error.message, index };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
