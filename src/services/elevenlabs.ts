export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.apiKey = this.getApiKey();
    this.initializeAudioContext();
  }

  private getApiKey(): string {
    const envKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    const storedKey = localStorage.getItem('elevenlabs_api_key');
    
    if (envKey) return envKey;
    if (storedKey) return storedKey;
    
    return '';
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('ElevenLabs audio context initialized');
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }

  async getVoices(): Promise<Array<{
    voiceId: string;
    name: string;
    category: string;
    description?: string;
    previewUrl?: string;
    labels?: Record<string, string>;
  }>> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.voices.map((voice: any) => ({
        voiceId: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        previewUrl: voice.preview_url,
        labels: voice.labels
      }));
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  async textToSpeech(
    text: string,
    voiceId: string,
    options: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
      modelId?: string;
    } = {}
  ): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      console.log('Generating speech with ElevenLabs:', text.substring(0, 50) + '...');
      
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: options.modelId || 'eleven_monolingual_v1',
          voice_settings: {
            stability: options.stability ?? 0.5,
            similarity_boost: options.similarityBoost ?? 0.75,
            style: options.style ?? 0.0,
            use_speaker_boost: options.useSpeakerBoost ?? true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('ElevenLabs audio generated successfully, size:', audioBuffer.byteLength);
      return audioBuffer;
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      throw error;
    }
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.audioContext) {
          throw new Error('Audio context not initialized');
        }

        // Stop any currently playing audio
        this.stopCurrentAudio();
        
        this.audioContext.decodeAudioData(audioBuffer.slice(0))
          .then(decodedData => {
            if (!this.audioContext) {
              throw new Error('Audio context lost during decoding');
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = decodedData;
            source.connect(this.audioContext.destination);
            
            this.currentSource = source;
            
            source.onended = () => {
              this.currentSource = null;
              resolve();
            };
            
            source.start();
            console.log('ElevenLabs audio playback started');
          })
          .catch(reject);
      } catch (error) {
        console.error('Error playing audio:', error);
        reject(error);
      }
    });
  }

  stopCurrentAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource = null;
        console.log('ElevenLabs audio stopped');
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  }

  async speakText(
    text: string,
    voiceId: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      useSpeakerBoost?: boolean;
      modelId?: string;
    }
  ): Promise<void> {
    try {
      // Ensure audio context is ready
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }

      const audioBuffer = await this.textToSpeech(text, voiceId, options);
      await this.playAudio(audioBuffer);
    } catch (error) {
      console.error('Error speaking text:', error);
      throw error;
    }
  }

  // Real-time streaming TTS
  connectStreamingTTS(
    voiceId: string,
    callbacks: {
      onAudioChunk?: (chunk: ArrayBuffer) => void;
      onError?: (error: any) => void;
      onClose?: () => void;
      onOpen?: () => void;
    },
    options: {
      stability?: number;
      similarityBoost?: number;
      modelId?: string;
    } = {}
  ): void {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=${options.modelId || 'eleven_monolingual_v1'}`;
    
    this.websocket = new WebSocket(wsUrl);
    this.websocket.binaryType = 'arraybuffer';

    this.websocket.onopen = () => {
      console.log('ElevenLabs streaming TTS connected');
      
      // Send initial configuration
      const config = {
        text: ' ',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75
        },
        xi_api_key: this.apiKey
      };
      
      this.websocket?.send(JSON.stringify(config));
      callbacks.onOpen?.();
    };

    this.websocket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        callbacks.onAudioChunk?.(event.data);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('ElevenLabs streaming TTS error:', error);
      callbacks.onError?.(error);
    };

    this.websocket.onclose = () => {
      console.log('ElevenLabs streaming TTS disconnected');
      callbacks.onClose?.();
    };
  }

  streamText(text: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        text: text + ' ',
        try_trigger_generation: true
      }));
    }
  }

  endStream(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        text: ''
      }));
      this.websocket.close();
    }
  }

  saveApiKey(apiKey: string): void {
    localStorage.setItem('elevenlabs_api_key', apiKey);
    this.apiKey = apiKey;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // Get recommended voices for interview scenarios
  getRecommendedVoices(): Array<{
    voiceId: string;
    name: string;
    description: string;
    category: string;
    recommended: boolean;
  }> {
    // These are popular ElevenLabs voices good for professional scenarios
    return [
      {
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
        name: 'Bella',
        description: 'Professional, warm female voice perfect for interviews',
        category: 'premade',
        recommended: true
      },
      {
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
        name: 'Rachel',
        description: 'Clear, articulate female voice with professional tone',
        category: 'premade',
        recommended: true
      },
      {
        voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi
        name: 'Domi',
        description: 'Confident, professional female voice',
        category: 'premade',
        recommended: true
      },
      {
        voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold
        name: 'Arnold',
        description: 'Professional male voice with authority',
        category: 'premade',
        recommended: false
      },
      {
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
        name: 'Adam',
        description: 'Deep, professional male voice',
        category: 'premade',
        recommended: false
      }
    ];
  }

  // Voice cloning capabilities
  async cloneVoice(
    name: string,
    audioFiles: File[],
    description?: string
  ): Promise<{
    voiceId: string;
    name: string;
    status: string;
  }> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const formData = new FormData();
    formData.append('name', name);
    if (description) {
      formData.append('description', description);
    }

    audioFiles.forEach((file, index) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${this.baseUrl}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        voiceId: data.voice_id,
        name: data.name,
        status: data.status
      };
    } catch (error) {
      console.error('Error cloning voice:', error);
      throw error;
    }
  }

  // Test the API connection and voice
  async testVoice(voiceId?: string): Promise<boolean> {
    try {
      const testVoiceId = voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Bella voice
      const testText = 'Hello, this is a test of the ElevenLabs voice synthesis system.';
      
      await this.speakText(testText, testVoiceId, {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        useSpeakerBoost: true
      });
      
      console.log('ElevenLabs voice test completed successfully');
      return true;
    } catch (error) {
      console.error('ElevenLabs voice test failed:', error);
      return false;
    }
  }

  // Get usage statistics
  async getUsageStats(): Promise<{
    characterCount: number;
    characterLimit: number;
    canMakeRequest: boolean;
  }> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        characterCount: data.subscription.character_count,
        characterLimit: data.subscription.character_limit,
        canMakeRequest: data.subscription.can_make_request
      };
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  }
}