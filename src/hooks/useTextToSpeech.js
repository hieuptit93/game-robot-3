import { useState, useCallback, useRef } from 'react';

const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(typeof window !== 'undefined' && 'speechSynthesis' in window);
  const utteranceRef = useRef(null);

  const speak = useCallback((text, options = {}) => {
    if (!isSupported) {
      console.warn('Text-to-Speech không được hỗ trợ trên trình duyệt này');
      return;
    }

    // Dừng bất kỳ phát âm nào đang chạy
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Cấu hình mặc định cho tiếng Anh
    utterance.lang = options.lang || 'en-US';
    utterance.rate = options.rate || 0.8; // Tốc độ chậm hơn để phát âm rõ ràng
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Thử tìm giọng nói tiếng Anh tốt nhất
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Google')
    ) || voices.find(voice => 
      voice.lang.startsWith('en')
    );
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Lỗi TTS:', event.error);
      setIsPlaying(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      utteranceRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isSupported
  };
};

export default useTextToSpeech;