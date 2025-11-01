/**
 * Sound notification utilities for visitor events
 */

export type SoundType = 'rubberduckie' | 'ohoh' | 'dong';

const soundFiles: Record<SoundType, string> = {
  rubberduckie: '/rubberduckie.mp3',
  ohoh: '/ohoh.mp3',
  dong: '/dong.mp3'
};

// Cache audio elements for reuse
const audioCache = new Map<SoundType, HTMLAudioElement>();
let isAudioEnabled = false;

/**
 * Initialize audio by enabling it on first user interaction
 * This is required for browsers (especially on Mac) that block autoplay
 */
const initializeAudio = (): void => {
  if (isAudioEnabled || typeof document === 'undefined') return;

  // Enable audio on first user interaction
  const enableAudioOnInteraction = () => {
    isAudioEnabled = true;
    // Try to play and immediately pause all cached audio elements to "unlock" them
    audioCache.forEach((audio) => {
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
      }).catch(() => {
        // Silently handle if audio can't be played
      });
    });
    // Remove event listeners after first interaction
    document.removeEventListener('click', enableAudioOnInteraction);
    document.removeEventListener('keydown', enableAudioOnInteraction);
    document.removeEventListener('touchstart', enableAudioOnInteraction);
    document.removeEventListener('mousedown', enableAudioOnInteraction);
    document.removeEventListener('focus', enableAudioOnInteraction);
  };

  // Listen for any user interaction to enable audio
  document.addEventListener('click', enableAudioOnInteraction, { once: true });
  document.addEventListener('keydown', enableAudioOnInteraction, { once: true });
  document.addEventListener('touchstart', enableAudioOnInteraction, { once: true });
  document.addEventListener('mousedown', enableAudioOnInteraction, { once: true });
  document.addEventListener('focus', enableAudioOnInteraction, { once: true });

  // Try to enable audio immediately if possible (some browsers allow this)
  setTimeout(() => {
    if (!isAudioEnabled) {
      // Try to enable by attempting to play any cached audio
      const firstAudio = Array.from(audioCache.values())[0];
      if (firstAudio) {
        firstAudio.play().then(() => {
          isAudioEnabled = true;
          firstAudio.pause();
          firstAudio.currentTime = 0;
        }).catch(() => {
          // Audio auto-enable failed, will wait for user interaction
        });
      }
    }
  }, 100);
};

/**
 * Get or create audio element for a sound type
 */
const getAudioElement = (soundType: SoundType, volume: number = 0.7): HTMLAudioElement => {
  if (!audioCache.has(soundType)) {
    const audio = new Audio(soundFiles[soundType]);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.preload = 'auto';
    audioCache.set(soundType, audio);
  }
  return audioCache.get(soundType)!;
};

// Initialize audio when module loads
if (typeof window !== 'undefined') {
  initializeAudio();
}

/**
 * Play a sound notification
 * @param soundType - The type of sound to play
 * @param volume - Volume level (0.0 to 1.0), defaults to 0.7
 */
export const playSound = (soundType: SoundType, volume: number = 0.7): void => {
  try {
    const audio = getAudioElement(soundType, volume);
    
    // If audio is not enabled yet, try to enable it now
    if (!isAudioEnabled) {
      audio.play().then(() => {
        isAudioEnabled = true;
        // Reset and play again
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Could not play audio
        });
      }).catch(() => {
        // Could not enable audio - will wait for user interaction
      });
      return;
    }

    // Audio is enabled, play it
    audio.currentTime = 0;
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
