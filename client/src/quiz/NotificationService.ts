// NotificationService.ts
class NotificationService {
    private static instance: NotificationService;
    private listeners: Array<(message: NotificationMessage) => void> = [];
  
    private constructor() {}
  
    public static getInstance(): NotificationService {
      if (!NotificationService.instance) {
        NotificationService.instance = new NotificationService();
      }
      return NotificationService.instance;
    }
  
    public subscribe(listener: (message: NotificationMessage) => void) {
      this.listeners.push(listener);
    }
  
    public unsubscribe(listener: (message: NotificationMessage) => void) {
      this.listeners = this.listeners.filter((l) => l !== listener);
    }
  
    public notify(message: NotificationMessage) {
      this.listeners.forEach((listener) => listener(message));
    }
  }
  
  export interface NotificationMessage {
    content: string;
    duration?: number;
    type?: string; // 'alert', 'ok' 등
  }
  
  export default NotificationService;
  