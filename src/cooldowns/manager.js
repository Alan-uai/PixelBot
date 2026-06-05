export class CooldownManager {
  constructor() {
    this.map = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set(guildId, userId, cmdId, seconds) {
    const key = `${guildId}:${userId}:${cmdId}`;
    this.map.set(key, Date.now() + seconds * 1000);
  }

  has(guildId, userId, cmdId) {
    const key = `${guildId}:${userId}:${cmdId}`;
    const expiry = this.map.get(key);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  getRemaining(guildId, userId, cmdId) {
    const key = `${guildId}:${userId}:${cmdId}`;
    const expiry = this.map.get(key);
    if (!expiry) return 0;
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    if (remaining <= 0) {
      this.map.delete(key);
      return 0;
    }
    return remaining;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.map) {
      if (now > expiry) {
        this.map.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.map.clear();
  }
}
