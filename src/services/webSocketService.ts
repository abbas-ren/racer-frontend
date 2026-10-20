import { GeneralWebsocketMessage } from 'types/websocket';
import { createWebSocket } from './wsClient';

type MessageCallback = (data: GeneralWebsocketMessage['payload']) => void;
type MessageType = string;

const listeners: Record<MessageType, Set<MessageCallback>> = {
  heartbeat: new Set(),
  heartbeatPing: new Set(),
  alert: new Set(),
  userData: new Set(),
  sshOutput: new Set(),
  deviceStateUpdate: new Set(),
  devicePowerUpdate: new Set(),
  deviceControllerChanged: new Set(),
  testExecution: new Set(),
  buildTestExecutionUpdate: new Set(),
  buildPerformanceUpdate: new Set(),
  buildStatusChanged: new Set(),
  buildUploaded: new Set(),
  uploadProgress: new Set(),
  uploadError: new Set(),
  uploadComplete: new Set(),
  relayConfigurationStatus: new Set(),
  rtosLog: new Set(),
  testExecutionStatusUpdate: new Set(),
  testExecutionTestcaseUpdate: new Set(),
  testExecutionQueuedUpdate: new Set(),
  testExecutionCancelRequestedUpdate: new Set(),
  
};

let socket: WebSocket | null = null;

export const subscribeTo = (type: MessageType, callback: MessageCallback) => {
  listeners[type].add(callback);
  return () => listeners[type].delete(callback);
};

export const startWebSocket = () => {
  if (socket) return;

  socket = createWebSocket('frontend', (data: GeneralWebsocketMessage) => {
    const kind = data['payload'].kind;

    kind && listeners[kind]?.forEach((cb) => cb(data['payload']));
  });

  socket.onclose = () => {
    socket = null;
    console.warn('[WebSocket Closed]');
  };
};
