// Simple event emitter for global communication
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Global event emitter instance
export const globalEventEmitter = new EventEmitter();

// Event types
export const EVENTS = {
  NEW_VISITOR: 'new_visitor',
  VISITOR_TAKEN: 'visitor_taken',
  VISITOR_DISCONNECTED: 'visitor_disconnected',
  UPDATE_VISITOR_LAST_MESSAGE: 'update_visitor_last_message',
  UPDATE_VISITOR_NAME: 'update_visitor_name',
} as const;

