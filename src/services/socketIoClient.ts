import { io, Socket } from 'socket.io-client';
import { SOCKET_IO_BASE_URL } from 'constants/config';

let socket: Socket | null = null;
let currentUserId: string | null = null;

export function getSharedSocket(userId?: string): Socket {
  const trimmedUserId = typeof userId === 'string' ? userId.trim() : '';

  if (!socket) {
    currentUserId = trimmedUserId || null;
    socket = io(SOCKET_IO_BASE_URL, {
      path: '/socket.io',
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
