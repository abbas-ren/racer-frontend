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
    let disposed = false;
    const ws = new WebSocket(buildWebSocketUrl({ client: 'frontend', target }));
    socketRef.current = ws;

    ws.onopen = () => {
      onOutput(`\r\n[FarmController] Connecting to ${target} over SSH...\r\n`);
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
      onOutput(
        '\r\n[FarmController] Terminal connection failed. Check authentication and target reachability.\r\n',
      );
    };

    ws.onclose = () => {
      if (!disposed) {
        onOutput('\r\n[FarmController] Terminal session closed.\r\n');
      }
    };

    return () => {
      disposed = true;
      ws.close();
    };
  }, [target, onOutput]);

  const write = useCallback((chunk: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'ssh_input', chunk }));
    }
  }, []);

  return { write };
}
