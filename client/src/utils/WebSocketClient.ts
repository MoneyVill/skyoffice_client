class WebSocketClient {
    private socket: WebSocket | null = null;
  
    connect(token: string, onMessage: (data: any) => void, onError?: (error: Event) => void) {
      if (!token) {
        console.error('Token is required for WebSocket connection.');
        return;
      }
      
      const wsUrl = `${import.meta.env.VITE_MODOO_API_URL}/api/ws/notifications?token=${token}`;
      console.log(wsUrl);
      this.socket = new WebSocket(wsUrl);
  
      this.socket.onopen = () => {
        console.log('WebSocket connection established.');
      };
  
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
  
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (onError) {
          onError(error);
        }
      };
  
      this.socket.onclose = () => {
        console.log('WebSocket connection closed.');
      };
    }
  
    send(command: string, data: any) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({ command, data });
        this.socket.send(message);
      } else {
        console.error('WebSocket is not connected.');
      }
    }
  
    disconnect() {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    }
  }
  
  export default new WebSocketClient();
  