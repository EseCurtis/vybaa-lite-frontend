// Twemoji icon imports for achievements and notifications
import alarmClock from '@iconify-icons/twemoji/alarm-clock'
import bell from '@iconify-icons/twemoji/bell'
import cherryBlossom from '@iconify-icons/twemoji/cherry-blossom'
import crescentMoon from '@iconify-icons/twemoji/crescent-moon'
import crossedSwords from '@iconify-icons/twemoji/crossed-swords'
import crown from '@iconify-icons/twemoji/crown'
import directHit from '@iconify-icons/twemoji/direct-hit'
import { default as dagger, default as eagle } from '@iconify-icons/twemoji/eagle'
import fire from '@iconify-icons/twemoji/fire'
import flexedBiceps from '@iconify-icons/twemoji/flexed-biceps'
import diamond from '@iconify-icons/twemoji/gem-stone'
import glowingStar from '@iconify-icons/twemoji/glowing-star'
import zap from '@iconify-icons/twemoji/high-voltage'
import loudspeaker from '@iconify-icons/twemoji/loudspeaker'
import partying from '@iconify-icons/twemoji/partying-face'
import sparkles from '@iconify-icons/twemoji/sparkles'
import medal from '@iconify-icons/twemoji/sports-medal'
import star from '@iconify-icons/twemoji/star'
import sunrise from '@iconify-icons/twemoji/sunrise'
import superhero from '@iconify-icons/twemoji/superhero'
import trophy from '@iconify-icons/twemoji/trophy'
import warning from '@iconify-icons/twemoji/warning'
import waterWave from '@iconify-icons/twemoji/water-wave'

// Map emoji text to iconify icons
export const EMOJI_ICONS = {
  // Streak Milestones
  '⭐': star,
  '🗡️': dagger,
  '⚔️': crossedSwords,
  '🦸': superhero,
  '👑': crown,
  '🌟': glowingStar,
  '🏆': trophy,
  '💎': diamond,
  
  // Other Achievements
  '🎯': directHit,
  '🏅': medal,
  '🔥': fire,
  '⚡': zap,
  '💪': flexedBiceps,
  '✨': sparkles,
  '🦅': eagle,
  '☀️': sunrise,
  '🌙': crescentMoon,
  '🌸': cherryBlossom,
  '🌊': waterWave,
  
  // Notifications
  '⏰': alarmClock,
  '🎉': partying,
  '🔔': bell,
  '📢': loudspeaker,
  '⚠️': warning,
}

// Get icon for emoji text
export function getEmojiIcon(emoji: string) {
  return EMOJI_ICONS[emoji as keyof typeof EMOJI_ICONS] || bell
}

// Get all emoji icons
export function getAllEmojiIcons() {
  return EMOJI_ICONS
}
