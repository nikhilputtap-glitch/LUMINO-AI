import { VoiceState } from '../types';

let ringtoneAudioContext: AudioContext | null = null;
let ringtoneOscillator1: OscillatorNode | null = null;
let ringtoneOscillator2: OscillatorNode | null = null;
let ringtoneGain: GainNode | null = null;
let ringtoneInterval: any = null;

export const VoiceService = {
  // Speech Recognition (STT)
  startListening: (onResult: (text: string) => void, onError: (error: any) => void): any => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (event.results[0].isFinal) {
        onResult(transcript);
      }
    };
    recognition.onerror = onError;
    recognition.start();
    return recognition;
  },

  // Text to Speech (TTS)
  speak: (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();

    // Clean text of markdown, asterisks, brackets, and code blocks
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/\{[\s\S]*?\}/g, '')
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    
    utterance.onend = () => {
      onEnd?.();
    };
    utterance.onerror = () => {
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  // Phone Ringtone Sound Generator using Web Audio API
  playRingtone: () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      ringtoneAudioContext = new AudioCtx();
      ringtoneGain = ringtoneAudioContext.createGain();
      ringtoneGain.connect(ringtoneAudioContext.destination);
      ringtoneGain.gain.setValueAtTime(0, ringtoneAudioContext.currentTime);

      const playRingBurst = () => {
        if (!ringtoneAudioContext || ringtoneAudioContext.state === 'closed') return;
        
        const now = ringtoneAudioContext.currentTime;
        const osc1 = ringtoneAudioContext.createOscillator();
        const osc2 = ringtoneAudioContext.createOscillator();
        const burstGain = ringtoneAudioContext.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // 440 Hz
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now); // 480 Hz

        osc1.connect(burstGain);
        osc2.connect(burstGain);
        burstGain.connect(ringtoneAudioContext.destination);

        // Ring pattern: Ring for 1.5 seconds, then silence
        burstGain.gain.setValueAtTime(0, now);
        burstGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
        burstGain.gain.setValueAtTime(0.18, now + 1.4);
        burstGain.gain.linearRampToValueAtTime(0, now + 1.5);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
      };

      // Play initial ring burst
      playRingBurst();
      // Repeat every 3 seconds like a phone ring
      ringtoneInterval = setInterval(playRingBurst, 3000);
    } catch (e) {
      console.warn("Could not play ringtone:", e);
    }
  },

  stopRingtone: () => {
    if (ringtoneInterval) {
      clearInterval(ringtoneInterval);
      ringtoneInterval = null;
    }
    if (ringtoneGain && ringtoneAudioContext) {
      try {
        ringtoneGain.gain.setValueAtTime(0, ringtoneAudioContext.currentTime);
      } catch {}
    }
    if (ringtoneAudioContext && ringtoneAudioContext.state !== 'closed') {
      try {
        ringtoneAudioContext.close();
      } catch {}
      ringtoneAudioContext = null;
    }
  }
};

