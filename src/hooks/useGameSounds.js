import { useCallback, useRef, useEffect } from 'react';

// Web Audio API sound generator
class SoundGenerator {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3; // Master volume
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  async ensureContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Tạo âm thanh power-up (tăng tần số)
  playPowerUp() {
    if (!this.audioContext) return;
    
    this.ensureContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Tần số tăng dần (power-up sound)
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.type = 'square';
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Tạo âm thanh va chạm (noise burst)
  playCollision() {
    if (!this.audioContext) return;
    
    this.ensureContext();
    
    // White noise cho va chạm
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // Low-pass filter cho âm va chạm
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    source.start(this.audioContext.currentTime);
    source.stop(this.audioContext.currentTime + 0.2);
  }

  // Tạo âm thanh nổ tung (explosion)
  playExplosion() {
    if (!this.audioContext) return;
    
    this.ensureContext();
    
    // Tạo nhiều layer âm thanh cho explosion
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Pink noise với decay
        for (let j = 0; j < bufferSize; j++) {
          const decay = 1 - (j / bufferSize);
          data[j] = (Math.random() * 2 - 1) * decay;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Different filter frequencies for layers
        filter.type = 'lowpass';
        filter.frequency.value = 800 - (i * 200);
        
        gainNode.gain.setValueAtTime(0.4 - (i * 0.1), this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        source.start(this.audioContext.currentTime);
        source.stop(this.audioContext.currentTime + 0.5);
      }, i * 50);
    }
  }

  // Tạo nhạc nền game hấp dẫn
  playBackgroundMusic() {
    if (!this.audioContext || this.musicOscillators) return;
    
    this.ensureContext();
    
    this.musicOscillators = [];
    this.musicGains = [];
    
    // Chord progression: Am - F - C - G (vi - IV - I - V)
    const chordProgression = [
      [220, 261.63, 329.63], // Am (A4, C5, E5)
      [174.61, 220, 261.63], // F (F4, A4, C5)
      [261.63, 329.63, 392], // C (C5, E5, G5)
      [196, 246.94, 293.66]  // G (G4, B4, D5)
    ];
    
    // Bass line
    const bassNotes = [110, 87.31, 130.81, 98]; // A2, F2, C3, G2
    
    let currentChord = 0;
    
    const playChord = () => {
      if (!this.audioContext || !this.musicOscillators) return;
      
      // Stop previous chord
      this.musicOscillators.forEach(osc => {
        if (osc && osc.stop) {
          try {
            osc.stop(this.audioContext.currentTime + 0.1);
          } catch (e) {}
        }
      });
      this.musicOscillators = [];
      this.musicGains = [];
      
      const chord = chordProgression[currentChord];
      const bass = bassNotes[currentChord];
      
      // Play bass note
      const bassOsc = this.audioContext.createOscillator();
      const bassGain = this.audioContext.createGain();
      
      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);
      
      bassOsc.frequency.value = bass;
      bassOsc.type = 'sine';
      
      bassGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      bassGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
      bassGain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 1.8);
      bassGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
      
      bassOsc.start(this.audioContext.currentTime);
      bassOsc.stop(this.audioContext.currentTime + 2);
      
      this.musicOscillators.push(bassOsc);
      this.musicGains.push(bassGain);
      
      // Play chord notes
      chord.forEach((freq, index) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.frequency.value = freq;
        osc.type = 'triangle';
        
        // Staggered entry for more musical effect
        const delay = index * 0.05;
        gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + delay + 0.1);
        gain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + delay + 1.8);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + delay + 2);
        
        osc.start(this.audioContext.currentTime + delay);
        osc.stop(this.audioContext.currentTime + delay + 2);
        
        this.musicOscillators.push(osc);
        this.musicGains.push(gain);
      });
      
      currentChord = (currentChord + 1) % chordProgression.length;
    };
    
    // Start first chord immediately
    playChord();
    
    // Set up interval for chord progression
    this.musicInterval = setInterval(playChord, 2000); // Change chord every 2 seconds
  }

  stopBackgroundMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    
    if (this.musicOscillators) {
      this.musicOscillators.forEach(osc => {
        if (osc && osc.stop) {
          try {
            osc.stop(this.audioContext.currentTime + 0.1);
          } catch (e) {}
        }
      });
      this.musicOscillators = null;
      this.musicGains = null;
    }
  }

  // Tạo âm thanh thành công (win)
  playWinSound() {
    if (!this.audioContext) return;
    
    this.ensureContext();
    
    // Chord progression cho win sound
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.8);
      }, index * 200);
    });
  }

  // Tạo âm thanh cảnh báo độ cao thấp
  playAltitudeWarning() {
    if (!this.audioContext) return;
    
    this.ensureContext();
    
    // Beeping sound cho cảnh báo
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    // Beep pattern: on-off-on-off
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.35);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Tạo âm thanh game over
  playGameOverSound() {
    if (!this.audioContext) return;
    
    this.ensureContext();
    
    // Descending notes cho game over
    const frequencies = [523.25, 466.16, 415.30, 369.99]; // C5, Bb4, Ab4, F#4
    
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.6);
      }, index * 300);
    });
  }
}

export const useGameSounds = () => {
  const soundGeneratorRef = useRef(null);

  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator();
    
    return () => {
      if (soundGeneratorRef.current?.musicOscillators) {
        soundGeneratorRef.current.stopBackgroundMusic();
      }
    };
  }, []);

  const playPowerUpSound = useCallback(() => {
    soundGeneratorRef.current?.playPowerUp();
  }, []);

  const playCollisionSound = useCallback(() => {
    soundGeneratorRef.current?.playCollision();
  }, []);

  const playExplosionSound = useCallback(() => {
    soundGeneratorRef.current?.playExplosion();
  }, []);

  const playBackgroundMusic = useCallback(() => {
    soundGeneratorRef.current?.playBackgroundMusic();
  }, []);

  const stopBackgroundMusic = useCallback(() => {
    soundGeneratorRef.current?.stopBackgroundMusic();
  }, []);

  const playWinSound = useCallback(() => {
    soundGeneratorRef.current?.playWinSound();
  }, []);

  const playGameOverSound = useCallback(() => {
    soundGeneratorRef.current?.playGameOverSound();
  }, []);

  const playAltitudeWarning = useCallback(() => {
    soundGeneratorRef.current?.playAltitudeWarning();
  }, []);

  return {
    playPowerUpSound,
    playCollisionSound,
    playExplosionSound,
    playBackgroundMusic,
    stopBackgroundMusic,
    playWinSound,
    playGameOverSound,
    playAltitudeWarning
  };
};