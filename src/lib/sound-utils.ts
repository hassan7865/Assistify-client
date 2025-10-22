/**
 * Sound notification utilities for visitor events
 */

export type SoundType = 'rubberduckie' | 'ohoh' | 'dong';

const soundFiles: Record<SoundType, string> = {
  rubberduckie: '/rubberduckie.mp3',
  ohoh: '/ohoh.mp3',
  dong: '/dong.mp3'
};

/**
 * Play a sound notification
 * @param soundType - The type of sound to play
 * @param volume - Volume level (0.0 to 1.0), defaults to 0.7
 */
export const playSound = (soundType: SoundType, volume: number = 0.7): void => {
  try {
    const audio = new Audio(soundFiles[soundType]);
    audio.volume = Math.max(0, Math.min(1, volume)); // Clamp volume between 0 and 1
    audio.preload = 'auto';
    
    // Try to play immediately
    audio.play().catch((error) => {
      // Silently handle audio play errors (user might have disabled autoplay)
      console.debug('Could not play sound:', error);
    });
  } catch (error) {
    console.debug('Error creating audio element:', error);
  }
};

/**
 * Play sound for new visitor arrival (UNRESOLVED state)
 */
export const playNewVisitorSound = (): void => {
  playSound('rubberduckie');
};

/**
 * Play sound for visitor status change to PENDING
 */
export const playPendingVisitorSound = (): void => {
  playSound('ohoh');
};

/**
 * Play sound for visitor message received
 */
export const playVisitorMessageSound = (): void => {
  playSound('dong');
};
