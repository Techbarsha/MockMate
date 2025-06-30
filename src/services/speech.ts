export class SpeechService {
  private recognition: any;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private onResultCallback?: (text: string) => void;
  private onEndCallback?: (error?: string) => void;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;
  private recognitionAttempts = 0;
  private maxAttempts = 3;
  private stopPromise: Promise<void> | null = null;

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
    this.recognition.maxAlternatives = 1;

    // Add more robust settings - fix the grammars property
    try {
      const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
      if (SpeechGrammarList) {
        this.recognition.grammars = new SpeechGrammarList();
      }
    } catch (error) {
      console.log('SpeechGrammarList not available, skipping grammar setup');
    }
    this.recognition.serviceURI = null;

    this.recognition.onstart = () => {
      console.log('Speech recognition started successfully');
      this.recognitionAttempts = 0;
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Provide interim results for better UX
      const currentTranscript = finalTranscript || interimTranscript;
      if (currentTranscript && this.onResultCallback) {
        this.onResultCallback(currentTranscript.trim());
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      this.isListening = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorType = event.error;
      console.log('Speech recognition event:', errorType);
      
      this.isListening = false;
      
      // Handle different error types appropriately
      switch (errorType) {
        case 'no-speech':
          console.log('No speech detected - this is normal, user may not have spoken yet');
          // Don't treat this as an error, just restart if needed
          if (this.recognitionAttempts < this.maxAttempts) {
            this.recognitionAttempts++;
            console.log(`Restarting recognition (attempt ${this.recognitionAttempts}/${this.maxAttempts})`);
            setTimeout(() => {
              if (!this.isListening) {
                this.restartRecognition();
              }
            }, 1000);
          } else {
            if (this.onEndCallback) {
              this.onEndCallback('no-speech-timeout');
            }
          }
          break;
          
        case 'aborted':
          console.log('Speech recognition was aborted - this is normal when stopping');
          if (this.onEndCallback) {
            this.onEndCallback();
          }
          break;
          
        case 'audio-capture':
          console.error('Audio capture failed - microphone issue');
          if (this.onEndCallback) {
            this.onEndCallback('microphone-error');
          }
          break;
          
        case 'not-allowed':
          console.error('Microphone permission denied');
          if (this.onEndCallback) {
            this.onEndCallback('permission-denied');
          }
          break;
          
        case 'network':
          console.error('Network error during speech recognition');
          if (this.onEndCallback) {
            this.onEndCallback('network-error');
          }
          break;
          
        case 'service-not-allowed':
          console.error('Speech recognition service not allowed');
          if (this.onEndCallback) {
            this.onEndCallback('service-error');
          }
          break;
          
        default:
          console.warn('Unknown speech recognition error:', errorType);
          if (this.onEndCallback) {
            this.onEndCallback(errorType);
          }
      }
    };

    this.recognition.onspeechstart = () => {
      console.log('Speech detected');
    };

    this.recognition.onspeechend = () => {
      console.log('Speech ended');
    };

    this.recognition.onsoundstart = () => {
      console.log('Sound detected');
    };

    this.recognition.onsoundend = () => {
      console.log('Sound ended');
    };
  }

  private async restartRecognition(): Promise<boolean> {
    if (!this.recognition) {
      return false;
    }

    // Always stop first to ensure clean state
    await this.stopListening();

    try {
      console.log('Restarting speech recognition...');
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error restarting speech recognition:', error);
      return false;
    }
  }

  async startListening(onResult: (text: string) => void, onEnd?: (error?: string) => void): Promise<boolean> {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return false;
    }

    // Always stop any existing session first - this is the key fix
    console.log('Ensuring any previous recognition session is stopped...');
    await this.stopListening();

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;
    this.recognitionAttempts = 0;

    try {
      console.log('Starting speech recognition...');
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.recognition || !this.isListening) {
      return Promise.resolve();
    }

    // If there's already a stop operation in progress, wait for it
    if (this.stopPromise) {
      return this.stopPromise;
    }

    this.stopPromise = new Promise<void>((resolve) => {
      const cleanup = () => {
        this.isListening = false;
        this.stopPromise = null;
        resolve();
      };

      // Set up event listeners for when recognition actually ends
      const originalOnEnd = this.recognition.onend;
      const originalOnError = this.recognition.onerror;

      const handleEnd = () => {
        console.log('Speech recognition stopped successfully');
        // Restore original handlers
        this.recognition.onend = originalOnEnd;
        this.recognition.onerror = originalOnError;
        cleanup();
      };

      const handleError = (event: any) => {
        console.log('Speech recognition stopped with error:', event.error);
        // Restore original handlers
        this.recognition.onend = originalOnEnd;
        this.recognition.onerror = originalOnError;
        cleanup();
      };

      // Temporarily override handlers to detect when stop completes
      this.recognition.onend = handleEnd;
      this.recognition.onerror = handleError;

      try {
        console.log('Stopping speech recognition...');
        this.recognition.stop();
        
        // Fallback timeout in case events don't fire
        setTimeout(() => {
          if (this.stopPromise) {
            console.log('Stop timeout reached, forcing cleanup');
            this.recognition.onend = originalOnEnd;
            this.recognition.onerror = originalOnError;
            cleanup();
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        // Restore original handlers
        this.recognition.onend = originalOnEnd;
        this.recognition.onerror = originalOnError;
        cleanup();
      }
    });

    return this.stopPromise;
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
            // Only log actual errors, not interruptions which are normal behavior
            if (error.error !== 'interrupted') {
              console.error('Speech synthesis error:', error);
            } else {
              console.log('Speech was interrupted (normal behavior)');
            }
            
            this.currentUtterance = null;
            
            // Don't reject for interrupted errors as they're often normal
            if (error.error === 'interrupted') {
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

  // Check microphone permissions
  async checkMicrophonePermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      stream.getTracks().forEach(track => track.stop()); // Clean up
      return true;
    } catch (error) {
      console.error('Microphone access denied or failed:', error);
      return false;
    }
  }
}