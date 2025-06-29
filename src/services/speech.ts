export class SpeechService {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private onResultCallback?: (text: string) => void;
  private onEndCallback?: () => void;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.initializeVoices();
  }

  private initializeVoices() {
    // Load voices when they become available
    const loadVoices = () => {
      this.voices = this.synthesis.getVoices();
      console.log('Available voices loaded:', this.voices.length);
      
      if (this.voices.length > 0) {
        this.isInitialized = true;
        console.log('Speech synthesis initialized with voices:', 
          this.voices.slice(0, 3).map(v => `${v.name} (${v.lang})`));
      }
    };

    // Initial load
    loadVoices();
    
    // Handle async voice loading
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }

    // Multiple fallbacks for different browsers
    setTimeout(loadVoices, 100);
    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1000);
    setTimeout(loadVoices, 2000);
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
      console.log('Speech recognition started');
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
      console.log('Speech recognition stopped');
    }
  }

  async speak(text: string, voice?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        console.error('Speech synthesis not supported');
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      console.log('Starting speech synthesis for:', text.substring(0, 50) + '...');

      // Cancel any ongoing speech
      this.synthesis.cancel();

      // Wait for cancellation to complete
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          this.currentUtterance = utterance;
          
          // Ensure voices are loaded
          if (this.voices.length === 0) {
            this.voices = this.synthesis.getVoices();
            console.log('Reloading voices, found:', this.voices.length);
          }

          // Configure voice based on accent preference
          const selectedVoice = this.findVoiceByAccent(voice || 'us');
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Using voice:', selectedVoice.name, selectedVoice.lang);
          } else {
            console.log('No specific voice found, using default');
          }

          // Configure speech parameters for clear, natural speech
          utterance.rate = 0.85; // Slightly slower for clarity
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          // Set up event handlers
          utterance.onstart = () => {
            console.log('Speech synthesis started');
          };

          utterance.onend = () => {
            console.log('Speech synthesis completed');
            this.currentUtterance = null;
            resolve();
          };

          utterance.onerror = (error) => {
            console.error('Speech synthesis error:', error);
            this.currentUtterance = null;
            
            // Don't reject for interrupted errors as they're often normal
            if (error.error === 'interrupted') {
              console.log('Speech was interrupted (normal behavior)');
              resolve();
            } else {
              reject(error);
            }
          };

          utterance.onpause = () => {
            console.log('Speech synthesis paused');
          };

          utterance.onresume = () => {
            console.log('Speech synthesis resumed');
          };

          // Handle speech boundary events for better lip sync
          utterance.onboundary = (event) => {
            if (event.name === 'word') {
              console.log('Speaking word at position:', event.charIndex);
            }
          };

          // Start speaking
          console.log('Calling speechSynthesis.speak()');
          this.synthesis.speak(utterance);

          // Fallback timeout - ensure promise resolves even if events don't fire
          const timeoutDuration = Math.max(text.length * 80, 3000); // Minimum 3 seconds
          setTimeout(() => {
            if (this.currentUtterance === utterance) {
              console.log('Speech timeout reached, resolving');
              this.currentUtterance = null;
              resolve();
            }
          }, timeoutDuration);

        } catch (error) {
          console.error('Error in speech synthesis setup:', error);
          reject(error);
        }
      }, 200); // Increased delay to ensure cancellation completes
    });
  }

  private findVoiceByAccent(accent: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      console.log('No voices available for accent selection');
      return null;
    }

    const accentMap: { [key: string]: string[] } = {
      'us': ['en-US', 'United States', 'US English', 'American', 'Samantha', 'Alex', 'Victoria'],
      'uk': ['en-GB', 'United Kingdom', 'UK English', 'British', 'England', 'Daniel', 'Kate'],
      'indian': ['en-IN', 'India', 'Indian', 'Rishi', 'Veena']
    };

    const searchTerms = accentMap[accent] || accentMap['us'];
    
    console.log('Searching for voice with accent:', accent, 'using terms:', searchTerms);

    // First, try to find exact language matches
    for (const term of searchTerms) {
      const voice = this.voices.find(v => 
        v.lang.toLowerCase() === term.toLowerCase()
      );
      if (voice) {
        console.log('Found exact language match:', voice.name, voice.lang);
        return voice;
      }
    }

    // Then try partial matches in language
    for (const term of searchTerms) {
      const voice = this.voices.find(v => 
        v.lang.toLowerCase().includes(term.toLowerCase())
      );
      if (voice) {
        console.log('Found language partial match:', voice.name, voice.lang);
        return voice;
      }
    }

    // Then try name matches
    for (const term of searchTerms) {
      const voice = this.voices.find(v => 
        v.name.toLowerCase().includes(term.toLowerCase())
      );
      if (voice) {
        console.log('Found name match:', voice.name, voice.lang);
        return voice;
      }
    }

    // Fallback to any English voice
    const englishVoice = this.voices.find(v => 
      v.lang.startsWith('en') || v.lang.includes('English')
    );
    if (englishVoice) {
      console.log('Using English fallback voice:', englishVoice.name, englishVoice.lang);
      return englishVoice;
    }

    // Last resort - use first available voice
    if (this.voices.length > 0) {
      console.log('Using first available voice:', this.voices[0].name, this.voices[0].lang);
      return this.voices[0];
    }

    console.log('No suitable voice found');
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

  get isVoiceReady(): boolean {
    return this.isInitialized && this.voices.length > 0;
  }

  cancelSpeech() {
    console.log('Cancelling speech synthesis');
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  // Test speech functionality
  async testSpeech(): Promise<void> {
    console.log('Testing speech synthesis...');
    console.log('Synthesis available:', !!this.synthesis);
    console.log('Voices loaded:', this.voices.length);
    console.log('Is initialized:', this.isInitialized);
    
    if (this.voices.length > 0) {
      console.log('Sample voices:', this.voices.slice(0, 3).map(v => `${v.name} (${v.lang})`));
    }

    try {
      await this.speak('Hello, this is a test of the speech synthesis system. Can you hear me clearly?');
      console.log('Speech test completed successfully');
    } catch (error) {
      console.error('Speech test failed:', error);
      throw error;
    }
  }

  // Force reload voices (useful for debugging)
  reloadVoices(): void {
    console.log('Force reloading voices...');
    this.voices = this.synthesis.getVoices();
    console.log('Voices after reload:', this.voices.length);
  }
}