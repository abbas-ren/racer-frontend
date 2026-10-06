import { createWebSocket, WebSocketMessage } from './wsClient';

type MessageCallback = (data: WebSocketMessage) => void;
type MessageType = WebSocketMessage['type'];

const listeners: Record<MessageType, Set<MessageCallback>> = {
  heartbeat: new Set(),
  alert: new Set(),
  user: new Set(),
  ssh: new Set(),
};

let socket: WebSocket | null = null;

export const subscribeTo = (type: MessageType, callback: MessageCallback) => {
  listeners[type].add(callback);
  return () => listeners[type].delete(callback);
};

export const startWebSocket = () => {
  if (socket) return;

  socket = createWebSocket('frontend', (data) => {
    listeners[data.type]?.forEach((cb) => cb(data));
  });

  socket.onclose = () => {
    socket = null;
    console.warn('[WebSocket Closed]');
  };
};
