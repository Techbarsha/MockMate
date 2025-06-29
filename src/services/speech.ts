export class SpeechService {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private onResultCallback?: (text: string) => void;
  private onEndCallback?: () => void;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.initializeVoices();
  }

  private initializeVoices() {
    // Load voices when they become available
    const loadVoices = () => {
      this.voices = this.synthesis.getVoices();
      console.log('Available voices:', this.voices.length);
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }

    // Fallback for browsers that don't support onvoiceschanged
    setTimeout(loadVoices, 100);
    setTimeout(loadVoices, 1000); // Additional fallback
  }

  private initializeSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript && this.onResultCallback) {
        this.onResultCallback(finalTranscript.trim());
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  startListening(onResult: (text: string) => void, onEnd?: () => void): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text: string, voice?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech first
      this.synthesis.cancel();

      // Wait a moment for cancellation to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;
        
        // Ensure voices are loaded
        if (this.voices.length === 0) {
          this.voices = this.synthesis.getVoices();
        }

        // Configure voice based on accent preference
        if (voice && this.voices.length > 0) {
          const selectedVoice = this.findVoiceByAccent(this.voices, voice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
          }
        } else if (this.voices.length > 0) {
          // Use first available English voice as fallback
          const englishVoice = this.voices.find(v => v.lang.startsWith('en'));
          if (englishVoice) {
            utterance.voice = englishVoice;
            console.log('Using fallback voice:', englishVoice.name, englishVoice.lang);
          }
        }

        // Configure speech parameters for natural speech
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Set up event handlers
        utterance.onstart = () => {
          console.log('Speech started');
        };

        utterance.onend = () => {
          console.log('Speech ended');
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = (error) => {
          // Handle interrupted errors as warnings since they're often benign
          if (error.error === 'interrupted') {
            console.warn('Speech synthesis interrupted:', error);
          } else {
            console.error('Speech synthesis error:', error);
          }
          this.currentUtterance = null;
          reject(error);
        };

        // Handle speech boundary events for lip sync
        utterance.onboundary = (event) => {
          if (event.name === 'word' || event.name === 'sentence') {
            // This can be used for more precise lip sync timing
            console.log('Speech boundary:', event.name, event.charIndex);
          }
        };

        // Start speaking
        console.log('Starting speech synthesis:', text.substring(0, 50) + '...');
        this.synthesis.speak(utterance);

        // Fallback timeout in case speech doesn't trigger onend
        setTimeout(() => {
          if (this.currentUtterance === utterance) {
            console.log('Speech timeout, resolving');
            this.currentUtterance = null;
            resolve();
          }
        }, (text.length * 100) + 5000); // Estimate based on text length + buffer
      }, 100);
    });
  }

  private findVoiceByAccent(voices: SpeechSynthesisVoice[], accent: string): SpeechSynthesisVoice | null {
    const accentMap: { [key: string]: string[] } = {
      'us': ['en-US', 'United States', 'US English', 'American'],
      'uk': ['en-GB', 'United Kingdom', 'UK English', 'British', 'England'],
      'indian': ['en-IN', 'India', 'Indian']
    };

    const searchTerms = accentMap[accent] || accentMap['us'];
    
    // First, try to find exact matches
    for (const term of searchTerms) {
      const voice = voices.find(v => 
        v.lang.toLowerCase().includes(term.toLowerCase()) || 
        v.name.toLowerCase().includes(term.toLowerCase())
      );
      if (voice) {
        console.log('Selected voice:', voice.name, voice.lang);
        return voice;
      }
    }

    // Fallback to any English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      console.log('Fallback voice:', englishVoice.name, englishVoice.lang);
      return englishVoice;
    }

    // Last resort - use first available voice
    if (voices.length > 0) {
      console.log('Last resort voice:', voices[0].name, voices[0].lang);
      return voices[0];
    }

    return null;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }
    return this.voices;
  }

  get isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  get isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  cancelSpeech() {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  // Get current speaking progress for lip sync
  getCurrentSpeechProgress(): number {
    if (this.currentUtterance && this.synthesis.speaking) {
      // This is a simplified progress calculation
      // In a real implementation, you might use more sophisticated timing
      return 0.5; // Placeholder
    }
    return 0;
  }
}