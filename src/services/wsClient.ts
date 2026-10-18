import { buildWebSocketUrl } from 'constants/config';
import { GeneralWebsocketMessage } from 'types/websocket';

export const createWebSocket = (
  client: 'frontend',
  onMessage: (message: GeneralWebsocketMessage) => void,
) => {
  const socket = new WebSocket(buildWebSocketUrl({ client }));
  socket.onmessage = (event) => {
    try {
      console.log('Received WebSocket event:', event.data);
      const data: GeneralWebsocketMessage = JSON.parse(String(event.data)) as GeneralWebsocketMessage;
      onMessage(data);
    } catch (error) {
      console.error('WebSocket message parse error', error);
    }
  };
  return socket;
};
