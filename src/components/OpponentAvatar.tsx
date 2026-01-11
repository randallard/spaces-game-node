/**
 * OpponentAvatar component for displaying opponent profile pictures
 * @module components/OpponentAvatar
 */

import type { ReactElement } from 'react';
import { getDiscordAvatarUrl, getDiscordDefaultAvatar } from '@/utils/discord-avatar';
import styles from './OpponentAvatar.module.css';

export interface OpponentAvatarProps {
  /** Opponent's name (for fallback display) */
  opponentName: string;
  /** Discord user ID (optional) */
  discordId?: string | undefined;
  /** Discord avatar hash (optional) */
  discordAvatar?: string | undefined;
  /** Avatar size in pixels (default: 40) */
  size?: number;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Opponent avatar component.
 * Displays Discord profile picture if available, otherwise shows initials.
 *
 * @component
 * @example
 * ```tsx
 * <OpponentAvatar
 *   opponentName="Alice"
 *   discordId="123456789"
 *   discordAvatar="a1b2c3d4e5"
 *   size={48}
 * />
 * ```
 */
export function OpponentAvatar({
  opponentName,
  discordId,
  discordAvatar,
  size = 40,
  className,
}: OpponentAvatarProps): ReactElement {
  // Try to get Discord avatar URL
  const avatarUrl = getDiscordAvatarUrl(discordId, discordAvatar, size);

  // Get initials for fallback
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]!.toUpperCase()}${parts[1]![0]!.toUpperCase()}`;
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(opponentName);

  // If we have Discord avatar, show it
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${opponentName}'s avatar`}
        className={`${styles.avatar} ${className || ''}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          // Fallback to default Discord avatar if image fails to load
          const target = e.target as HTMLImageElement;
          if (discordId && target.src !== getDiscordDefaultAvatar(discordId)) {
            target.src = getDiscordDefaultAvatar(discordId);
          } else {
            // If default Discord avatar also fails, hide the image and show initials
            target.style.display = 'none';
          }
        }}
      />
    );
  }

  // If we have Discord ID but no avatar, show default Discord avatar
  if (discordId) {
    return (
      <img
        src={getDiscordDefaultAvatar(discordId)}
        alt={`${opponentName}'s avatar`}
        className={`${styles.avatar} ${className || ''}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          // If default avatar fails, hide and show initials
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // Fallback: Show initials in a circle
  return (
    <div
      className={`${styles.initialsAvatar} ${className || ''}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={opponentName}
    >
      {initials}
    </div>
  );
}
