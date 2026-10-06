import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentUserId: string | null = null;

function getSocketBaseUrl(): string {
  const explicitBase = import.meta.env.VITE_SOCKET_IO_BASE_URL;
  if (typeof explicitBase === 'string' && explicitBase.trim()) {
    return explicitBase.trim();
  }

  const protocol = window.location.protocol;
  const host =
    import.meta.env.VITE_WS_HOST || window.location.hostname || 'localhost';
  const port =
    import.meta.env.VITE_SOCKET_IO_PORT ||
    (import.meta.env.VITE_DOCKER === 'true' ? '85' : '5007');

  return `${protocol}//${host}:${port}`;
}

export function getSharedSocket(userId?: string): Socket {
  const trimmedUserId = typeof userId === 'string' ? userId.trim() : '';

  if (!socket) {
    currentUserId = trimmedUserId || null;
    socket = io(getSocketBaseUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: currentUserId ? { userId: currentUserId } : {},
      transports: ['polling', 'websocket'],
    });
  }

  if (trimmedUserId && trimmedUserId !== currentUserId) {
    currentUserId = trimmedUserId;
    socket.auth = { ...(socket.auth || {}), userId: trimmedUserId };
    if (socket.connected) {
      socket.disconnect();
    }
  }

  // Avoid repeated connect calls while a handshake is already in progress.
  if (!socket.connected && !socket.active) {
    socket.connect();
  }

  return socket;
}

export function disconnectSharedSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentUserId = null;
  }
}
