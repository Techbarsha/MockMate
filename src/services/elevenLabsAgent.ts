export class ElevenLabsAgentService {
  private apiKey: string;
  private agentId = 'agent_01jyzdegxnfr8tyx3w08xgp6pm';
  private conversationSignature = 'cvtkn_01jyzdngjge1br8mxapn6r1mp2';
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private isConnected = false;
  private conversationId: string | null = null;

  constructor() {
    this.apiKey = this.getApiKey();
    this.initializeAudioContext();
  }

  private getApiKey(): string {
    const envKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    const storedKey = localStorage.getItem('elevenlabs_api_key');
    const providedKey = 'sk_54b7d57e3443eebc96062eac13fa7d28d410d19049a1df39';
    
    if (envKey) return envKey;
    if (storedKey) return storedKey;
    if (providedKey) {
      localStorage.setItem('elevenlabs_api_key', providedKey);
      return providedKey;
    }
    
    return '';
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('ElevenLabs Agent audio context initialized');
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }

  async startAgentConversation(callbacks: {
    onMessage?: (message: string, isAgent: boolean) => void;
    onAudioChunk?: (chunk: ArrayBuffer) => void;
    onError?: (error: any) => void;
    onConnected?: () => void;
    onDisconnected?: () => void;
  }): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      // First, create a conversation session
      const conversationResponse = await fetch(`${this.baseUrl}/convai/conversations`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          conversation_signature: this.conversationSignature
        })
      });

      if (!conversationResponse.ok) {
        throw new Error(`Failed to create conversation: ${conversationResponse.status}`);
      }

      const conversationData = await conversationResponse.json();
      this.conversationId = conversationData.conversation_id;

      console.log('ElevenLabs Agent conversation created:', this.conversationId);

      // Connect to WebSocket for real-time communication
      const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversations/${this.conversationId}/ws`;
      
      this.websocket = new WebSocket(wsUrl, [], {
        headers: {
          'xi-api-key': this.apiKey
        }
      } as any);

      this.websocket.binaryType = 'arraybuffer';

      this.websocket.onopen = () => {
        console.log('ElevenLabs Agent WebSocket connected');
        this.isConnected = true;
        callbacks.onConnected?.();
      };

      this.websocket.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            // Text message from agent
            const data = JSON.parse(event.data);
            
            if (data.type === 'agent_response') {
              callbacks.onMessage?.(data.message, true);
            } else if (data.type === 'user_transcript') {
              callbacks.onMessage?.(data.message, false);
            }
          } else if (event.data instanceof ArrayBuffer) {
            // Audio chunk from agent
            callbacks.onAudioChunk?.(event.data);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('ElevenLabs Agent WebSocket error:', error);
        callbacks.onError?.(error);
      };

      this.websocket.onclose = () => {
        console.log('ElevenLabs Agent WebSocket disconnected');
        this.isConnected = false;
        callbacks.onDisconnected?.();
      };

      return true;
    } catch (error) {
      console.error('Error starting agent conversation:', error);
      callbacks.onError?.(error);
      return false;
    }
  }

  sendUserMessage(message: string): void {
    if (this.websocket && this.isConnected) {
      const messageData = {
        type: 'user_message',
        message: message,
        timestamp: new Date().toISOString()
      };
      
      this.websocket.send(JSON.stringify(messageData));
      console.log('Sent message to ElevenLabs Agent:', message);
    } else {
      console.error('WebSocket not connected');
    }
  }

  async playAudioChunk(audioChunk: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioChunk.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio chunk:', error);
    }
  }

  endConversation(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.isConnected = false;
    this.conversationId = null;
    console.log('ElevenLabs Agent conversation ended');
  }

  get isAgentConnected(): boolean {
    return this.isConnected;
  }

  get currentConversationId(): string | null {
    return this.conversationId;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // Get conversation history
  async getConversationHistory(): Promise<Array<{
    role: 'user' | 'agent';
    message: string;
    timestamp: string;
  }>> {
    if (!this.conversationId || !this.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/convai/conversations/${this.conversationId}/history`, {
        headers: {
          'xi-api-key': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversation history: ${response.status}`);
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  // Test agent connection
  async testAgentConnection(): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/convai/agents/${this.agentId}`, {
        headers: {
          'xi-api-key': this.apiKey,
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing agent connection:', error);
      return false;
    }
  }
}