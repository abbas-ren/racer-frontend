import { useEffect, useRef, useCallback } from 'react';

interface SshOutputMessage {
  type: 'ssh';
  stream: 'stdout' | 'stderr';
  chunk: string;
}

// interface SshStartMessage {
//   type: 'ssh_start';
//   target: string;
// }

// interface SshInputMessage {
//   type: 'ssh_input';
//   chunk: string;
// }

const getWebSocketUrl = (target: string) => {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = import.meta.env.VITE_WS_HOST || 'localhost';
  const port = import.meta.env.VITE_WS_PORT || '5002';
  const path = `/ws?client=frontend&target=${encodeURIComponent(target)}`;
  return `${protocol}://${host}:${port}${path}`;
};

export function useSshSocket(
  target: string,
  onOutput: (chunk: string) => void,
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl(target));
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'ssh_start', target }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: SshOutputMessage = JSON.parse(event.data);
        if (msg.type === 'ssh') {
          onOutput(msg.chunk);
        }
      } catch (err) {
        console.error('SSH message parse error', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [target, onOutput]);

  const write = useCallback((chunk: string) => {
    socketRef.current?.send(JSON.stringify({ type: 'ssh_input', chunk }));
  }, []);

  return { write };
}
