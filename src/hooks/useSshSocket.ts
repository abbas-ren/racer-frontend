import { useEffect, useRef, useCallback } from 'react';
import { buildWebSocketUrl } from 'constants/config';

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

export function useSshSocket(
  target: string,
  onOutput: (chunk: string) => void,
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(buildWebSocketUrl({ client: 'frontend', target }));
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
