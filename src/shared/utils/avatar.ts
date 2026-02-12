/**
 * Generate a Reddit avatar URL for a user
 * Reddit default avatars are numbered 0-19
 * We'll use a simple hash of the userId to consistently pick an avatar
 */
export function getRedditAvatarUrl(userId: string): string {
  // Simple hash function to convert userId to a number 0-19
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const avatarNumber = Math.abs(hash) % 20; // 0-19
  
  return `https://www.redditstatic.com/avatars/defaults/v2/avatar_default_${avatarNumber}.png`;
}
