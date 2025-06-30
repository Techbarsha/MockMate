export class TavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';
  private conversationId: string | null = null;
  private websocket: WebSocket | null = null;

  constructor() {
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    const envKey = import.meta.env.VITE_TAVUS_API_KEY;
    const storedKey = localStorage.getItem('tavus_api_key');
    
    if (envKey) return envKey;
    if (storedKey) return storedKey;
    
    return '';
  }

  async createConversation(config: {
    replicaId: string;
    conversationName: string;
    callbackUrl?: string;
    properties?: {
      maxDuration?: number;
      language?: string;
      enableRecording?: boolean;
    };
  }): Promise<{
    conversationId: string;
    conversationUrl: string;
    status: string;
  }> {
    if (!this.apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replica_id: config.replicaId,
          conversation_name: config.conversationName,
          callback_url: config.callbackUrl,
          properties: {
            max_duration: config.properties?.maxDuration || 1800, // 30 minutes
            language: config.properties?.language || 'en',
            enable_recording: config.properties?.enableRecording || false,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      const data = await response.json();
      this.conversationId = data.conversation_id;
      
      return {
        conversationId: data.conversation_id,
        conversationUrl: data.conversation_url,
        status: data.status
      };
    } catch (error) {
      console.error('Error creating Tavus conversation:', error);
      throw error;
    }
  }

  async getConversationStatus(conversationId?: string): Promise<{
    status: string;
    duration?: number;
    participantCount?: number;
  }> {
    const id = conversationId || this.conversationId;
    if (!id || !this.apiKey) {
      throw new Error('No conversation ID or API key available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations/${id}`, {
        headers: {
          'x-api-key': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: data.status,
        duration: data.duration,
        participantCount: data.participant_count
      };
    } catch (error) {
      console.error('Error getting conversation status:', error);
      throw error;
    }
  }

  async endConversation(conversationId?: string): Promise<void> {
    const id = conversationId || this.conversationId;
    if (!id || !this.apiKey) {
      throw new Error('No conversation ID or API key available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations/${id}/end`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      this.conversationId = null;
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
      throw error;
    }
  }

  connectWebSocket(conversationId: string, callbacks: {
    onMessage?: (message: any) => void;
    onError?: (error: any) => void;
    onClose?: () => void;
    onOpen?: () => void;
  }): void {
    const wsUrl = `wss://tavusapi.com/v2/conversations/${conversationId}/ws`;
    
    this.websocket = new WebSocket(wsUrl, ['tavus-protocol']);
    
    this.websocket.onopen = () => {
      console.log('Tavus WebSocket connected');
      callbacks.onOpen?.();
    };

    this.websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        callbacks.onMessage?.(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.websocket.onerror = (error) => {
      console.error('Tavus WebSocket error:', error);
      callbacks.onError?.(error);
    };

    this.websocket.onclose = () => {
      console.log('Tavus WebSocket disconnected');
      callbacks.onClose?.();
    };
  }

  sendMessage(message: string): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'user_message',
        content: message,
        timestamp: new Date().toISOString()
      }));
    } else {
      console.error('WebSocket not connected');
    }
  }

  saveApiKey(apiKey: string): void {
    localStorage.setItem('tavus_api_key', apiKey);
    this.apiKey = apiKey;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // Get available replicas for the account
  async getReplicas(): Promise<Array<{
    replicaId: string;
    name: string;
    status: string;
    createdAt: string;
  }>> {
    if (!this.apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/replicas`, {
        headers: {
          'x-api-key': this.apiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status}`);
      }

      const data = await response.json();
      return data.replicas || [];
    } catch (error) {
      console.error('Error fetching replicas:', error);
      throw error;
    }
  }
}