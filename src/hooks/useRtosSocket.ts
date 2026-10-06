import { useEffect, useRef, useCallback } from 'react';

interface SshOutputMessage {
  type: 'ssh';
  stream: 'stdout' | 'stderr';
  chunk: string;
}

const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = import.meta.env.VITE_WS_HOST || 'localhost';
  const port = import.meta.env.VITE_WS_PORT || '5002';
  const path = `/ws?client=frontend`;
  return `${protocol}://${host}:${port}${path}`;
};

export function useRtosSocket(
  deviceId: string,
  onOutput: (chunk: string) => void,
  command?: string,
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl());
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'rtos_ssh_start',
          deviceId,
          command,
        }),
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg: SshOutputMessage = JSON.parse(event.data);
        if (msg.type === 'ssh') {
          onOutput(msg.chunk);
        }
      } catch (err) {
        console.error('RTOS message parse error', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [deviceId, onOutput, command]);

  const write = useCallback((chunk: string) => {
    socketRef.current?.send(JSON.stringify({ type: 'ssh_input', chunk }));
  }, []);

  return { write };
}
