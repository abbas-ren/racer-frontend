import { useEffect, useRef, useCallback } from 'react';
import { buildWebSocketUrl } from 'constants/config';

interface SshOutputMessage {
  type: 'ssh';
  stream: 'stdout' | 'stderr';
  chunk: string;
}

export function useRtosSocket(
  deviceId: string,
  onOutput: (chunk: string) => void,
  command?: string,
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(buildWebSocketUrl({ client: 'frontend' }));
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
