import { buildWebSocketUrl } from 'constants/config';

export interface HeartbeatData {
  type: 'heartbeat';
  deviceId?: string;
  controllerId?: string;
  deviceControllerId?: string;
  timestamp?: string | number;
  status?: string;
  [key: string]: any;
}

export interface AlertData {
  type: 'alert';
  level?: 'info' | 'warning' | 'critical';
  subtype?: string;
  message: any;
  timestamp?: string;
}

export interface UserData {
  type: 'user';
  method: string;
  message: any;
}

export interface SshOutputMessage {
  type: 'ssh';
  stream: 'stdout' | 'stderr';
  chunk: string;
}

export type WebSocketMessage =
  | HeartbeatData
  | AlertData
  | UserData
  | SshOutputMessage;

export interface GenericWsMessage {
  type?: string;
  data?: unknown;
  [key: string]: unknown;
}

export const createWebSocket = (
  client: 'frontend',
  onMessage: (message: WebSocketMessage) => void,
) => {
  const socket = new WebSocket(buildWebSocketUrl({ client }));
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(String(event.data)) as WebSocketMessage);
    } catch (error) {
      console.error('WebSocket message parse error', error);
    }
  };
  return socket;
};
