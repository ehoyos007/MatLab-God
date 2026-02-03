'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type SoundType = 'correct' | 'wrong' | 'hint';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

const STORAGE_KEY = 'matlabgod_sound';

// Web Audio API sound generation
function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
}

function playTone(
  ctx: AudioContext,
  frequencies: number[],
  durations: number[],
  type: OscillatorType = 'square'
) {
  let startTime = ctx.currentTime;

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + durations[i]);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durations[i]);

    startTime += durations[i] * 0.8; // Slight overlap for smoother sound
  });
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Load preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setSoundEnabled(stored === 'true');
    }
  }, []);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtx) {
        const ctx = createAudioContext();
        setAudioCtx(ctx);
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [audioCtx]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled || !audioCtx) return;

    // Resume context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    switch (type) {
      case 'correct':
        // Rising arpeggio - cheerful retro victory sound
        playTone(audioCtx, [523, 659, 784, 1047], [0.1, 0.1, 0.1, 0.2], 'square');
        break;
      case 'wrong':
        // Descending buzz - error sound
        playTone(audioCtx, [200, 150], [0.15, 0.2], 'sawtooth');
        break;
      case 'hint':
        // Soft chime - info sound
        playTone(audioCtx, [880, 1100], [0.08, 0.12], 'sine');
        break;
    }
  }, [soundEnabled, audioCtx]);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundContext() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    throw new Error('useSoundContext must be used within SoundProvider');
  }
  return ctx;
}
