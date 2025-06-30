export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private websocket: WebSocket | null = null;

  constructor() {
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    const envKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    const storedKey = localStorage.getItem('elevenlabs_api_key');
    
    if (envKey) return envKey;
    if (storedKey) return storedKey;
    
    return '';
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
        throw new Error(`ElevenLabs API error: ${response.status}`);
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
            stability: options.stability || 0.5,
            similarity_boost: options.similarityBoost || 0.5,
            style: options.style || 0.0,
            use_speaker_boost: options.useSpeakerBoost || true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      throw error;
    }
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        audioContext.decodeAudioData(audioBuffer)
          .then(decodedData => {
            const source = audioContext.createBufferSource();
            source.buffer = decodedData;
            source.connect(audioContext.destination);
            
            source.onended = () => resolve();
            source.start();
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
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
          stability: options.stability || 0.5,
          similarity_boost: options.similarityBoost || 0.5
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
        throw new Error(`ElevenLabs API error: ${response.status}`);
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
}