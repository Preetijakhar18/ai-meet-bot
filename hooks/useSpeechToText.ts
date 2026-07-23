'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechToText() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopListening = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignored if already stopped
      }
    }
    setIsListening(false);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // 30 Seconds Inactivity Auto-Stop Timer
    inactivityTimerRef.current = setTimeout(() => {
      console.log('30 seconds silence reached. Turning off microphone.');
      stopListening();
    }, 30000);
  }, [stopListening]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      resetInactivityTimer();
    };

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const resultTranscript = event.results[current][0].transcript;
      setTranscriptText(resultTranscript);
      resetInactivityTimer(); // Reset timer when voice input is detected
    };

    recognitionRef.current.onerror = (event: any) => {
      // Ignore routine silence timeouts from browser engine
      if (event.error === 'no-speech') {
        return;
      }
      console.warn('Speech recognition warning:', event.error);
      stopListening();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }
  }, [resetInactivityTimer, stopListening]);

  return {
    isListening,
    transcriptText,
    startListening,
    stopListening,
  };
}