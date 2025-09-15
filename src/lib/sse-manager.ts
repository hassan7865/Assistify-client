/**
 * Global SSE Connection Manager
 * Ensures only one SSE connection exists across the entire application
 */

class SSEManager {
  private static instance: SSEManager;
  private eventSource: EventSource | null = null;
  private isConnected = false;
  private currentAgentId: string | null = null;
  private listeners: Set<(data: any) => void> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  public connect(agentId: string, baseUrl: string): boolean {
    // If already connected to the same agent, do nothing
    if (this.isConnected && this.currentAgentId === agentId) {
      return true;
    }

    // If connected to a different agent, disconnect first
    if (this.isConnected && this.currentAgentId !== agentId) {
      this.disconnect();
    }

    // If EventSource exists and is open/connecting, close it
    if (this.eventSource?.readyState === EventSource.OPEN || 
        this.eventSource?.readyState === EventSource.CONNECTING) {
      this.eventSource.close();
    }

    const sseUrl = `${baseUrl}/notifications/stream/${agentId}`;

    try {
      this.eventSource = new EventSource(sseUrl);
      this.currentAgentId = agentId;
      this.isConnected = true;

      this.eventSource.onopen = () => {
        this.isConnected = true;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Notify all listeners
          this.listeners.forEach(listener => {
            try {
              listener(data);
            } catch (error) {
              console.error('Error in SSE listener:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        this.isConnected = false;

        // Only attempt reconnection if we don't have a pending reconnection
        if (!this.reconnectTimeout && this.currentAgentId) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            // Only reconnect if we still have the same agent ID
            if (this.currentAgentId) {
              this.connect(this.currentAgentId, baseUrl);
            }
          }, 3000);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      this.isConnected = false;
      this.currentAgentId = null;
      return false;
    }
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isConnected = false;
    this.currentAgentId = null;
  }

  public addListener(listener: (data: any) => void): void {
    this.listeners.add(listener);
  }

  public removeListener(listener: (data: any) => void): void {
    this.listeners.delete(listener);
    
    // If no listeners remain, disconnect after a short delay
    if (this.listeners.size === 0) {
      setTimeout(() => {
        if (this.listeners.size === 0) {
          this.disconnect();
        }
      }, 5000); // 5 second delay to allow for quick reconnections
    }
  }

  public getConnectionStatus(): { isConnected: boolean; agentId: string | null } {
    return {
      isConnected: this.isConnected,
      agentId: this.currentAgentId
    };
  }

  public isConnectedToAgent(agentId: string): boolean {
    return this.isConnected && this.currentAgentId === agentId;
  }
}

export default SSEManager;
