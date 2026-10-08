import { useCallback, useEffect, useRef } from 'react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useSshSocket } from '../../hooks/useSshSocket';
import '@xterm/xterm/css/xterm.css';

export default function TerminalComponent({
  target,
  adminTerminal = false,
}: {
  target: string;
  adminTerminal?: boolean;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  const handleOutput = useCallback((chunk: string) => {
    termRef.current?.write(chunk);
  }, []);

  const { resize, write } = useSshSocket(target, handleOutput, adminTerminal);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      scrollback: 3000,
      convertEol: true,

      fontSize: 13,
      lineHeight: 1.6,
      letterSpacing: 0.3,
      fontWeight: '400',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',

      theme: {
        background: '#0b1220',
        foreground: '#d1d5db',
        cursor: '#22c55e',
        cursorAccent: '#0b1220',
        selectionBackground: '#264f78',

        black: '#1f2937',
        red: '#f87171',
        green: '#22c55e',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#e5e7eb',

        brightBlack: '#6b7280',
        brightRed: '#ef4444',
        brightGreen: '#4ade80',
        brightYellow: '#fde047',
        brightBlue: '#93c5fd',
        brightMagenta: '#d8b4fe',
        brightCyan: '#67e8f9',
        brightWhite: '#ffffff',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current!);
    termRef.current = term;
    const inputSubscription = term.onData((data) => write(data));
    const resizeSubscription = term.onResize(({ cols, rows }) =>
      resize(cols, rows),
    );
    const observer = new ResizeObserver(() => fitAddon.fit());
    observer.observe(terminalRef.current!);
    fitAddon.fit();
    term.focus();

    return () => {
      observer.disconnect();
      inputSubscription.dispose();
      resizeSubscription.dispose();
      term.dispose();
    };
  }, [resize, write]);

  return (
    <div
      ref={terminalRef}
      style={{
        height: '100%',
        width: '100%',
        padding: '16px',
        boxSizing: 'border-box',
        backgroundColor: '#0b1220',
      }}
    />
  );
}
