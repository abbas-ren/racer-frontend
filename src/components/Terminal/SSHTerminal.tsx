import { useCallback, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { useSshSocket } from '../../hooks/useSshSocket';
import '@xterm/xterm/css/xterm.css';

export default function SSHTerminalComponent({ target }: { target: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  const handleOutput = useCallback((chunk: string) => {
    console.log('[Terminal Input]', chunk);
    termRef.current?.write(chunk);
  }, []);

  const { write } = useSshSocket(target, handleOutput);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      scrollback: 2000,
      disableStdin: false,
      convertEol: true,
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: '"Fira Code", monospace',
      theme: {
        background: '#FFFFFF',
        foreground: '#010105',
        cursor: '#010105',
        selectionBackground: '#004400',
      },
    });

    term.open(terminalRef.current!);
    term.focus();
    termRef.current = term;

    term.onData((data) => {
      write(data);
    });

    return () => {
      term.dispose();
    };
  }, [write]);

  return (
    <div
      ref={terminalRef}
      style={{
        height: '100%',
        width: '100%',
        // overflow: 'auto',
        backgroundColor: 'white',
        borderRadius: '4px',
      }}
    />
  );
}
