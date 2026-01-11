/**
 * Discord avatar utilities
 * @module utils/discord-avatar
 */

/**
 * Get Discord avatar URL from user data
 * @param discordId - Discord user ID
 * @param avatarHash - Discord avatar hash (from OAuth response)
 * @param size - Avatar size (default: 128)
 * @returns Full CDN URL for the avatar, or null if no avatar
 */
export function getDiscordAvatarUrl(
  discordId: string | undefined,
  avatarHash: string | undefined,
  size: number = 128
): string | null {
  if (!discordId || !avatarHash) {
    return null;
  }

  // Discord CDN URL format
  // https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.{format}
  // Animated avatars start with 'a_' and use .gif, otherwise use .png
  const isAnimated = avatarHash.startsWith('a_');
  const format = isAnimated ? 'gif' : 'png';

  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${format}?size=${size}`;
}

/**
 * Get Discord default avatar URL
 * Falls back to Discord's default avatar based on user's discriminator or ID
 * @param discordId - Discord user ID
 * @returns URL for default Discord avatar
 */
export function getDiscordDefaultAvatar(discordId: string): string {
  // Discord's default avatar is based on (user_id >> 22) % 6 for new users
  // Or discriminator % 5 for legacy users
  // Since we're using new Discord usernames, use user_id
  const userId = BigInt(discordId);
  const index = Number((userId >> 22n) % 6n);
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
