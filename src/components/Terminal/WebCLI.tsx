import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './webcli.css';
import { getAuth, getUsername } from '../../utils/auth';
import { buildWebSocketUrl } from 'constants/config';
import { InputPromptWidget } from './InputPromptWidget';
import { PromptRequest } from './types';

export default function WebCLIModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentInputRef = useRef<string>('');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 120, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 120, y: 80 });
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  const [currentPrompt, setCurrentPrompt] = useState<PromptRequest | null>(
    null,
  );

  // Resize state
  const [inputHeight, setInputHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [isStreamingLogs, setIsStreamingLogs] = useState(false);
  const activeTestsRef = useRef<Set<string>>(new Set());
  const displayedMessagesRef = useRef<Set<string>>(new Set());
  // const [trackedTests, setTrackedTests] = useState<Set<string>>(new Set());
  const trackedTestsRef = useRef<Set<string>>(new Set());

  // Add autocomplete state and refs
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] =
    useState<number>(0);
  const showingSuggestionsRef = useRef(false);

  type FlagValidationSpec = {
    requiresValue: boolean;
  };

  type CommandValidationSpec = {
    maxPositionalArgs: number;
    flags: Record<string, FlagValidationSpec>;
  };

  const commandValidationSpecs: Record<string, CommandValidationSpec> = {
    'racer-help': {
      maxPositionalArgs: 1,
      flags: {},
    },
    'racer-clear': {
      maxPositionalArgs: 0,
      flags: {},
    },
    'racer-list-devices': {
      maxPositionalArgs: 0,
      flags: {},
    },
    'racer-list-builds': {
      maxPositionalArgs: 2,
      flags: {
        '--limit': { requiresValue: true },
        '-l': { requiresValue: true },
        '--flagged': { requiresValue: false },
        '-f': { requiresValue: false },
        '--help': { requiresValue: false },
        '-h': { requiresValue: false },
      },
    },
    'racer-list-test-plans': {
      maxPositionalArgs: 0,
      flags: {
        '--filter': { requiresValue: true },
        '-f': { requiresValue: true },
        '--help': { requiresValue: false },
        '-h': { requiresValue: false },
      },
    },
    'racer-list-test-suites': {
      maxPositionalArgs: 1,
      flags: {
        '--help': { requiresValue: false },
        '-h': { requiresValue: false },
      },
    },
    'racer-list-test-cases': {
      maxPositionalArgs: 2,
      flags: {
        '--help': { requiresValue: false },
        '-h': { requiresValue: false },
      },
    },
    'racer-run-test': {
      maxPositionalArgs: 4,
      flags: {
        '--all': { requiresValue: false },
        '-a': { requiresValue: false },
        '--logs': { requiresValue: false },
        '-l': { requiresValue: false },
        '--suites': { requiresValue: true },
        '-s': { requiresValue: true },
        '--cases': { requiresValue: true },
        '-c': { requiresValue: true },
        '--exclude-suites': { requiresValue: true },
        '--exclude-cases': { requiresValue: true },
        '--help': { requiresValue: false },
        '-h': { requiresValue: false },
      },
    },
  };

  // List of available commands for autocomplete
  const availableCommands = Object.keys(commandValidationSpecs);

  const normalizeCommandHistory = (history: string[]): string[] => {
    const normalized: string[] = [];

    history.forEach((entry) => {
      const command = entry.trim();
      if (!command) return;

      const existingIndex = normalized.indexOf(command);
      if (existingIndex !== -1) {
        normalized.splice(existingIndex, 1);
      }

      normalized.push(command);
    });

    if (normalized.length > 100) {
      return normalized.slice(normalized.length - 100);
    }

    return normalized;
  };

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentPrompt(null);
      setIsStreamingLogs(false);
      activeTestsRef.current.clear();
      displayedMessagesRef.current.clear();
      trackedTestsRef.current.clear();
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }
  }, [open]);

  // Main terminal setup
  useEffect(() => {
    if (!open) return;

    const term = new Terminal({
      disableStdin: true,
      cursorBlink: false,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 13,
      fontWeight: '400',
      letterSpacing: 0,
      lineHeight: 1,
      scrollback: 3000,
      convertEol: true,
      theme: {
        background: '#0b1220',
        foreground: '#d1d5db',
        selection: 'rgba(255, 255, 255, 0.3)',
        cursor: '#00ff00',
        cursorAccent: '#000000',
      } as any,
    });

    term.write('\x1b[?25l');

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current!);
    term.textarea?.blur();

    const syncTerminalMetrics = () => {
      fitAddon.fit();
      term.refresh(0, Math.max(term.rows - 1, 0));
    };

    syncTerminalMetrics();

    const fitAfterRenderFrame = requestAnimationFrame(() => {
      requestAnimationFrame(syncTerminalMetrics);
    });

    const fitAfterLayoutTimer = window.setTimeout(syncTerminalMetrics, 150);

    let disposed = false;
    const fontFaceSet = (
      document as Document & {
        fonts?: { ready?: Promise<unknown> };
      }
    ).fonts;
    if (fontFaceSet?.ready) {
      fontFaceSet.ready
        .then(() => {
          if (!disposed) {
            syncTerminalMetrics();
          }
        })
        .catch(() => {});
    }

    const onSelectionStart = () => {
      syncTerminalMetrics();
    };
    terminalRef.current?.addEventListener('mousedown', onSelectionStart);

    const onViewportResize = () => {
      syncTerminalMetrics();
    };
    window.visualViewport?.addEventListener('resize', onViewportResize);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    inputRef.current?.focus();

    const userId = getAuth();

    const userName = getUsername();

    console.log(userName);

    console.log('Connecting CLI WebSocket for user:', userId);

    const ws = new WebSocket(
      buildWebSocketUrl({ client: 'cli', userId, userName }),
    );

    const handleTestUpdate = (
      terminal: Terminal,
      testId: string,
      update: any,
    ) => {
      if (!update) return;

      const GREEN = '\x1b[32m';
      const CYAN = '\x1b[36m';
      const RED = '\x1b[31m';
      const GRAY = '\x1b[90m';
      const RESET = '\x1b[0m';

      let output = '';

      switch (update.type) {
        case 'new':
          output = `${GREEN}✓ Test ${testId.slice(0, 8)} queued${RESET}`;
          break;

        case 'status':
          const statusColor = getStatusColor(update.data.status);
          output = `${statusColor}[${testId.slice(0, 8)}] ${update.data.status}${RESET}`;

          if (update.data.message) {
            output += `\r\n${GRAY}  ${update.data.message}${RESET}`;
          }

          // Stop streaming when test completes
          const finalStatuses = ['completed', 'FAILED', 'CANCELLED', 'PASSED'];
          if (finalStatuses.includes(update.data.status)) {
            console.log('🏁 Test finished with status:', update.data.status);
            console.log('🏁 Removing testId from activeTests:', testId);

            activeTestsRef.current.delete(testId);

            console.log(
              '🏁 Remaining active tests:',
              Array.from(activeTestsRef.current),
            );

            if (activeTestsRef.current.size === 0) {
              console.log('🏁 No more active tests - stopping streaming');
              setIsStreamingLogs(false);

              // Re-enable input
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.disabled = false;
                  inputRef.current.focus();
                  console.log('🏁 Input re-enabled');
                }
              }, 100);

              terminal.writeln('');
              terminal.writeln(`${GRAY}✓ Log streaming completed${RESET}`);
              terminal.writeln('');
            }
          }
          break;

        case 'log':
          output = `${GRAY}[${testId.slice(0, 8)}] ${update.data.message}${RESET}`;
          break;

        case 'progress':
          if (update.data.current && update.data.total) {
            const percent = Math.round(
              (update.data.current / update.data.total) * 100,
            );
            output = `${CYAN}[${testId.slice(0, 8)}] Progress: ${update.data.current}/${update.data.total} (${percent}%)${RESET}`;
          }
          break;

        case 'test_case_result':
          const result = update.data.result;
          const resultColor = result === 'PASS' ? GREEN : RED;
          output = `${resultColor}  ${update.data.testCaseId}: ${result}${RESET}`;

          if (update.data.message) {
            output += `\r\n${GRAY}    ${update.data.message}${RESET}`;
          }
          break;

        case 'error':
          output = `${RED}[${testId.slice(0, 8)}] ERROR: ${update.data.message}${RESET}`;
          break;

        default:
          console.log('Unknown update type:', update.type, update);
          break;
      }

      if (output) {
        terminal.writeln(output);
        setTimeout(() => {
          terminal.scrollToBottom();
        }, 10);
      }
    };

    const getStatusColor = (status: string): string => {
      const colors: Record<string, string> = {
        QUEUED: '\x1b[33m',
        IN_PROGRESS: '\x1b[36m',
        COMPLETED: '\x1b[32m',
        PASSED: '\x1b[32m',
        FAILED: '\x1b[31m',
        CANCELLED: '\x1b[90m',
        NOT_EXECUTED: '\x1b[90m',
      };
      return colors[status.toUpperCase()] || '\x1b[37m';
    };

    ws.onopen = () => {
      console.log('CLI WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        console.log('CLI received message:', parsed.type);

        // if (parsed.type === "test_execution_update") {
        //   handleTestUpdate(parsed);
        //   return;
        // }

        if (parsed.type === 'test_execution_link') {
          const { testId } = parsed;

          trackedTestsRef.current.add(testId);
          // setTrackedTests(new Set(trackedTestsRef.current));

          // if (termRef.current) {
          //   termRef.current.writeln('');
          //   termRef.current.writeln(
          //     "\x1b[36m\x1b[1m✓ Click 'View Test Execution' button below to monitor execution in UI\x1b[0m",
          //   );
          //   termRef.current.writeln('');
          // }

          return;
        }

        if (parsed.type === 'start_log_capture') {
          activeTestsRef.current.add(parsed.testId);

          setIsStreamingLogs(true);

          displayedMessagesRef.current.clear();
          return;
        }
        // Handle log streaming start/stop
        if (parsed.type === 'test_execution') {
          const { testId, update } = parsed;

          // Check if we should stream this test's logs
          if (activeTestsRef.current.has(testId)) {
            // Create unique message ID
            const messageId = `${testId}|${update.type}|${JSON.stringify(update.data)}`;

            // Check if already displayed
            if (displayedMessagesRef.current.has(messageId)) {
              return; // Skip duplicate
            }

            // Mark as displayed
            displayedMessagesRef.current.add(messageId);
            handleTestUpdate(term, testId, update);
          } else if (
            trackedTestsRef.current.has(testId) &&
            update.type === 'status'
          ) {
            const finalStatuses = ['completed', 'cancelled'];

            if (finalStatuses.includes(update.data.status)) {
              // Show completion notification
              const GREEN = '\x1b[32m';
              const RED = '\x1b[31m';
              const YELLOW = '\x1b[33m';
              const GRAY = '\x1b[90m';
              const BOLD = '\x1b[1m';
              const RESET = '\x1b[0m';

              let statusColor = GRAY;
              let statusIcon = '○';

              if (update.data.status === 'completed') {
                statusColor = GREEN;
                statusIcon = '✓';
              } else if (update.data.status === 'FAILED') {
                statusColor = RED;
                statusIcon = '✗';
              } else if (update.data.status === 'cancelled') {
                statusColor = YELLOW;
                statusIcon = '⊘';
              }

              term.writeln('');
              term.writeln(
                `${statusColor}${BOLD}${statusIcon} Test Execution ${update.data.status}${RESET}`,
              );
              term.writeln(`${BOLD}  Test ID: ${testId.slice(0, 12)}${RESET}`);

              if (update.data.message) {
                term.writeln(`${BOLD}  ${update.data.message}${RESET}`);
              }

              term.writeln('');

              setTimeout(() => term.scrollToBottom(), 10);

              // Remove from tracked tests
              trackedTestsRef.current.delete(testId);
              // setTrackedTests(new Set(trackedTestsRef.current));
            }
          }

          return;
        }

        if (parsed.type === 'prompt') {
          const promptData = parsed.data as PromptRequest;
          setTimeout(() => {
            term.scrollToBottom();
          }, 10);

          setCurrentPrompt(promptData);

          return;
        }

        if (parsed.type === 'cli') {
          term.writeln(parsed.output || '');

          if (!currentPrompt) {
            setTimeout(() => {
              term.scrollToBottom();
            }, 10);
          }
        }
      } catch (error) {
        console.error('Failed to parse message:', error);
        term.writeln(event.data);
      }
    };

    ws.onclose = (event) => {
      console.log('🔌 CLI WebSocket closed:', event.code, event.reason);
    };

    ws.onerror = (error) => {
      console.error('CLI WebSocket error:', error);
    };

    wsRef.current = ws;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => fitAddon.fit(), 10);
    });
    resizeObserver.observe(modalRef.current!);

    // Load command history
    const savedHistory = localStorage.getItem('racer-cli-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        const historyArray = Array.isArray(parsedHistory) ? parsedHistory : [];
        const normalizedHistory = normalizeCommandHistory(
          historyArray.filter(
            (entry): entry is string => typeof entry === 'string',
          ),
        );
        commandHistoryRef.current = normalizedHistory;
        localStorage.setItem(
          'racer-cli-history',
          JSON.stringify(normalizedHistory),
        );

        currentInputRef.current = '';
        historyIndexRef.current = -1;

        if (inputRef.current) {
          inputRef.current.value = '';
        }
      } catch (e) {
        console.error('Failed to load command history:', e);
      }
    }

    // Global keyboard listener
    //Use window listener with capture phase (catches BEFORE terminal)
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // Only handle Ctrl+C when streaming
      if (e.ctrlKey && e.key === 'c' && activeTestsRef.current.size > 0) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        console.log('STOPPING STREAM');

        activeTestsRef.current.clear();
        setIsStreamingLogs(false);

        if (termRef.current) {
          termRef.current.writeln('');
          termRef.current.writeln('\x1b[90m^C\x1b[0m');
          termRef.current.writeln('\x1b[90mLog streaming stopped\x1b[0m');
          termRef.current.writeln('');
        }

        if (inputRef.current) {
          inputRef.current.disabled = false;
          setTimeout(() => inputRef.current?.focus(), 50);
        }

        return false;
      }
    };

    // Attach to window with capture = true (highest priority)
    window.addEventListener('keydown', handleWindowKeyDown, true);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isFocusedOnInput = document.activeElement === inputRef.current;

      // Ctrl+C for copy (when not streaming)
      if (
        e.ctrlKey &&
        e.key === 'c' &&
        !isFocusedOnInput &&
        activeTestsRef.current.size === 0
      ) {
        const selection = termRef.current?.getSelection();
        if (selection) {
          e.preventDefault();
          navigator.clipboard.writeText(selection);
        }
      }

      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        if (termRef.current) {
          termRef.current.clear();
        }
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up CLI modal');

      window.removeEventListener('keydown', handleGlobalKeyDown, true);
      resizeObserver.disconnect();
      disposed = true;
      cancelAnimationFrame(fitAfterRenderFrame);
      clearTimeout(fitAfterLayoutTimer);
      terminalRef.current?.removeEventListener('mousedown', onSelectionStart);
      window.visualViewport?.removeEventListener('resize', onViewportResize);

      // Stop log streaming if active
      // Clear active tests
      activeTestsRef.current.clear();
      setIsStreamingLogs(false);

      // Cancel any pending prompts
      if (currentPrompt && ws.readyState === WebSocket.OPEN) {
        console.log('📤 Sending cancellation for prompt:', currentPrompt.id);
        ws.send(
          JSON.stringify({
            type: 'prompt_response',
            data: {
              id: currentPrompt.id,
              value: null,
              cancelled: true,
            },
          }),
        );
      }

      setCurrentPrompt(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      console.log('Closing CLI WebSocket');
      ws.close();

      term.dispose();

      // Clear pending navigation on close
      delete (window as any).__pendingTestNavigation;
    };
  }, [open]);

  // Re-fit terminal when prompt state changes
  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
      }, 250);
    }
  }, [currentPrompt]);

  // Add function to start streaming for a test
  const startLogStreaming = useCallback((testId: string) => {
    activeTestsRef.current.add(testId);
    setIsStreamingLogs(true);

    if (termRef.current) {
      termRef.current.writeln('');
      termRef.current.writeln(
        `\x1b[36m📡 Streaming logs for test: ${testId}\x1b[0m`,
      );
      termRef.current.writeln(`\x1b[90mPress Ctrl+C to stop streaming\x1b[0m`);
      termRef.current.writeln('');
    }
  }, []);

  // Expose startLogStreaming through window for backend to call
  useEffect(() => {
    if (open && wsRef.current) {
      (window as any).__cliStartLogStreaming = startLogStreaming;

      return () => {
        delete (window as any).__cliStartLogStreaming;
      };
    }
  }, [open, startLogStreaming]);
  // Handle prompt response
  const handlePromptResponse = (value: any, cancelled: boolean = false) => {
    console.log(
      '📤 Sending prompt response:',
      currentPrompt?.id,
      cancelled ? '(cancelled)' : '(completed)',
    );

    if (
      currentPrompt &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      if (!cancelled) {
        let displayValue = '';

        if (Array.isArray(value)) {
          if (value.length === 0) {
            displayValue = '(none)';
          } else if (value.length === 1) {
            displayValue = String(value[0]);
          } else {
            displayValue = value.join(', ');
          }
        } else if (typeof value === 'boolean') {
          displayValue = value ? 'yes' : 'no';
        } else {
          displayValue = String(value);
        }

        termRef.current?.writeln(`\x1b[90m> ${displayValue}\x1b[0m`);
      } else {
        termRef.current?.writeln(`\x1b[90m(cancelled)\x1b[0m`);
      }

      setTimeout(() => {
        termRef.current?.scrollToBottom();
      }, 10);

      wsRef.current.send(
        JSON.stringify({
          type: 'prompt_response',
          data: {
            id: currentPrompt.id,
            value,
            cancelled,
          },
        }),
      );
    } else {
      console.warn(
        '⚠️ Cannot send response - WebSocket not ready or no prompt active',
      );
    }

    setCurrentPrompt(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    inputRef.current?.focus();
  };

  // Handle keyboard input
  // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter') {
  //     const cmd = e.currentTarget.value.trim();

  //     if (cmd) {
  //       if (termRef.current) {
  //         const now = new Date().toLocaleTimeString();
  //         termRef.current.writeln(
  //           `\x1b[90m[${now}]\x1b[0m \x1b[32m$\x1b[0m ${cmd}`,
  //         );
  //       }
  //       commandHistoryRef.current.push(cmd);

  //       // Keep only last 100 commands
  //       if (commandHistoryRef.current.length > 100) {
  //         commandHistoryRef.current.shift();
  //       }

  //       localStorage.setItem(
  //         'racer-cli-history',
  //         JSON.stringify(commandHistoryRef.current),
  //       );

  //       historyIndexRef.current = -1;
  //       currentInputRef.current = '';

  //       if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
  //         wsRef.current.send(JSON.stringify({ type: 'cli', command: cmd }));
  //       }

  //       e.currentTarget.value = '';
  //     }
  //   } else if (e.key === 'ArrowUp') {
  //     e.preventDefault();

  //     if (commandHistoryRef.current.length === 0) return;

  //     if (historyIndexRef.current === -1) {
  //       currentInputRef.current = e.currentTarget.value;
  //       historyIndexRef.current = commandHistoryRef.current.length - 1;
  //     } else if (historyIndexRef.current > 0) {
  //       historyIndexRef.current--;
  //     }

  //     e.currentTarget.value =
  //       commandHistoryRef.current[historyIndexRef.current];
  //   } else if (e.key === 'ArrowDown') {
  //     e.preventDefault();

  //     if (historyIndexRef.current === -1) return;

  //     if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
  //       historyIndexRef.current++;
  //       e.currentTarget.value =
  //         commandHistoryRef.current[historyIndexRef.current];
  //     } else {
  //       historyIndexRef.current = -1;
  //       e.currentTarget.value = currentInputRef.current;
  //     }
  //   }
  // };

  // Update handleKeyDown to include Tab and arrow key handling for autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Tab key for autocomplete
    if (e.key === 'Tab') {
      e.preventDefault();

      const currentValue = e.currentTarget.value.trim();
      const suggestions = getAutocompleteSuggestions(currentValue);

      if (suggestions.length > 0) {
        if (!showingSuggestionsRef.current) {
          // First Tab - show suggestions
          setAutocompleteSuggestions(suggestions);
          setSelectedSuggestionIndex(0);
          showingSuggestionsRef.current = true;
        } else {
          // Subsequent Tab - cycle through suggestions
          const nextIndex = (selectedSuggestionIndex + 1) % suggestions.length;
          setSelectedSuggestionIndex(nextIndex);
          e.currentTarget.value = suggestions[nextIndex];
        }
      }

      return;
    }

    // Handle arrow keys when showing suggestions
    if (showingSuggestionsRef.current && autocompleteSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex =
          (selectedSuggestionIndex + 1) % autocompleteSuggestions.length;
        setSelectedSuggestionIndex(nextIndex);
        e.currentTarget.value = autocompleteSuggestions[nextIndex];
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex =
          selectedSuggestionIndex === 0
            ? autocompleteSuggestions.length - 1
            : selectedSuggestionIndex - 1;
        setSelectedSuggestionIndex(prevIndex);
        e.currentTarget.value = autocompleteSuggestions[prevIndex];
        return;
      }

      if (e.key === 'Escape') {
        // Clear suggestions
        setAutocompleteSuggestions([]);
        showingSuggestionsRef.current = false;
        return;
      }
    }

    if (e.key === 'Enter') {
      const cmd = e.currentTarget.value.trim();

      // Clear autocomplete suggestions
      setAutocompleteSuggestions([]);
      showingSuggestionsRef.current = false;

      if (cmd) {
        termRef.current?.writeln(`\x1b[32m$\x1b[0m ${cmd}`);

        const validation = validateWebCliCommand(cmd);

        if (!validation.valid) {
          termRef.current?.writeln('');
          termRef.current?.writeln(`\x1b[31m✗ ${validation.error}\x1b[0m`);
          termRef.current?.writeln(
            '\x1b[90mUse racer-help to see valid commands.\x1b[0m',
          );
          termRef.current?.writeln('');
          setTimeout(() => {
            termRef.current?.scrollToBottom();
          }, 10);

          historyIndexRef.current = -1;
          currentInputRef.current = '';
          e.currentTarget.value = '';
          return;
        }

        const normalizedCommand = validation.normalized || cmd;

        commandHistoryRef.current = normalizeCommandHistory([
          ...commandHistoryRef.current,
          normalizedCommand,
        ]);
        localStorage.setItem(
          'racer-cli-history',
          JSON.stringify(commandHistoryRef.current),
        );

        historyIndexRef.current = -1;
        currentInputRef.current = '';

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({ type: 'cli', command: normalizedCommand }),
          );
        }

        e.currentTarget.value = '';
      }
    } else if (e.key === 'ArrowUp') {
      // Only use for history if not showing suggestions
      if (!showingSuggestionsRef.current) {
        e.preventDefault();
        if (commandHistoryRef.current.length === 0) return;

        if (historyIndexRef.current === -1) {
          currentInputRef.current = e.currentTarget.value;
          historyIndexRef.current = commandHistoryRef.current.length - 1;
        } else if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
        }

        e.currentTarget.value =
          commandHistoryRef.current[historyIndexRef.current];
      }
    } else if (e.key === 'ArrowDown') {
      // Only use for history if not showing suggestions
      if (!showingSuggestionsRef.current) {
        e.preventDefault();
        if (historyIndexRef.current === -1) return;

        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          e.currentTarget.value =
            commandHistoryRef.current[historyIndexRef.current];
        } else {
          historyIndexRef.current = -1;
          e.currentTarget.value = currentInputRef.current;
        }
      }
    }
  };

  // Update handleInputChange to show suggestions as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (historyIndexRef.current === -1) {
      currentInputRef.current = e.currentTarget.value;
    }

    // Show autocomplete suggestions as user types
    const value = e.currentTarget.value.trim();

    if (value.length > 0) {
      const suggestions = getAutocompleteSuggestions(value);

      if (suggestions.length > 0 && suggestions[0] !== value) {
        setAutocompleteSuggestions(suggestions);
        setSelectedSuggestionIndex(0);
        showingSuggestionsRef.current = true;
      } else {
        setAutocompleteSuggestions([]);
        showingSuggestionsRef.current = false;
      }
    } else {
      setAutocompleteSuggestions([]);
      showingSuggestionsRef.current = false;
    }
  };

  // Dragging logic
  const startDrag = (e: React.MouseEvent) => {
    if (isFullscreen) return;

    e.preventDefault();
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!dragging) return;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';

    const handleMouseMove = (e: MouseEvent) => {
      if (!modalRef.current) return;

      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;

      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const minX = 0;
      const maxX = viewportWidth - modalWidth;
      const minY = 0;
      const maxY = viewportHeight - modalHeight;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      pendingPositionRef.current = {
        x: newX,
        y: newY,
      };

      if (dragRafRef.current === null) {
        dragRafRef.current = window.requestAnimationFrame(() => {
          const nextPosition = pendingPositionRef.current;
          if (nextPosition) {
            positionRef.current = nextPosition;
            setPosition(nextPosition);
          }
          dragRafRef.current = null;
        });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }

      if (pendingPositionRef.current) {
        positionRef.current = pendingPositionRef.current;
        setPosition(pendingPositionRef.current);
      }

      pendingPositionRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }

      pendingPositionRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [dragging]);

  // Resize logic
  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const startY = e.clientY;
    const startHeight = inputHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY; // Drag up = increase height
      const newHeight = Math.max(100, Math.min(450, startHeight + deltaY));
      setInputHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  // Function to get autocomplete suggestions
  const getAutocompleteSuggestions = (input: string): string[] => {
    if (!input || input.trim() === '') return [];

    const commandToken = input.trim().split(/\s+/)[0].toLowerCase();

    // Match commands that start with the input
    const matches = availableCommands.filter((cmd) =>
      cmd.toLowerCase().startsWith(commandToken),
    );

    return matches;
  };

  const validateWebCliCommand = (
    command: string,
  ): { valid: boolean; normalized?: string; error?: string } => {
    const trimmed = command.trim();

    if (!trimmed) {
      return { valid: false, error: 'Command cannot be empty.' };
    }

    const tokenizeCommand = (input: string): string[] => {
      const tokens: string[] = [];
      let current = '';
      let inQuotes = false;
      let quoteChar = '';

      for (let index = 0; index < input.length; index += 1) {
        const char = input[index];

        if ((char === '"' || char === "'") && !inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
          inQuotes = false;
          quoteChar = '';
        } else if (char === ' ' && !inQuotes) {
          if (current) {
            tokens.push(current);
            current = '';
          }
        } else {
          current += char;
        }
      }

      if (current) {
        tokens.push(current);
      }

      return tokens;
    };

    const tokens = tokenizeCommand(trimmed).filter(Boolean);
    const baseCommand = tokens[0];
    const spec = commandValidationSpecs[baseCommand];

    if (!spec) {
      return {
        valid: false,
        error: `Unknown command: '${trimmed}'.`,
      };
    }

    let positionalCount = 0;

    for (let index = 1; index < tokens.length; index += 1) {
      const token = tokens[index];

      if (token.startsWith('-')) {
        const [flagName, inlineValue] = token.split('=', 2);
        const flagSpec = spec.flags[flagName];

        if (!flagSpec) {
          return {
            valid: false,
            error: `Unsupported flag '${flagName}' for '${baseCommand}'.`,
          };
        }

        if (flagSpec.requiresValue) {
          const nextToken = tokens[index + 1];
          const hasSeparateValue = !!nextToken && !nextToken.startsWith('-');

          if (!inlineValue && !hasSeparateValue) {
            return {
              valid: false,
              error: `Flag '${flagName}' requires a value.`,
            };
          }

          if (!inlineValue && hasSeparateValue) {
            index += 1;
          }
        } else if (inlineValue) {
          return {
            valid: false,
            error: `Flag '${flagName}' does not accept a value.`,
          };
        }

        continue;
      }

      positionalCount += 1;

      if (positionalCount > spec.maxPositionalArgs) {
        return {
          valid: false,
          error: `Too many arguments for '${baseCommand}'.`,
        };
      }
    }

    return { valid: true, normalized: trimmed };
  };

  // Calculate dynamic padding
  const terminalPadding = currentPrompt ? inputHeight - 80 + 20 : 14;

  const isInputDisabled = isStreamingLogs || !!currentPrompt;

  if (!open) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: isFullscreen
          ? 'none'
          : `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: isFullscreen ? '100vw' : 720,
        height: isFullscreen ? '100vh' : 520,
        background: '#0b1220',
        borderRadius: isFullscreen ? 0 : 12,
        display: 'flex',
        flexDirection: 'column',
        resize: isFullscreen ? 'none' : 'both',
        overflow: 'hidden',
        zIndex: 9999,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        transition: dragging ? 'none' : 'transform 0.12s ease-out',
        willChange: dragging ? 'transform' : 'auto',
      }}
    >
      {/* HEADER */}
      <div
        className="webcli-header"
        onMouseDown={startDrag}
        style={{
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isFullscreen ? 'default' : 'move',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#d1d5db' }}>
            RACER CLI Terminal
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: 16,
            }}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? '⊡' : '□'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px 8px',
              fontSize: 16,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* OUTPUT SECTION - with dynamic padding */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: 14,
          paddingBottom: terminalPadding,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'text',
          transition: isResizing ? 'none' : 'padding-bottom 0.15s ease',
        }}
        onClick={() => {
          terminalRef.current?.focus();
        }}
      >
        <div
          ref={terminalRef}
          className="webcli-output"
          tabIndex={0}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            userSelect: 'text',
            outline: 'none',
          }}
        />
      </div>

      {/* RESIZE HANDLE - only show when prompt is active */}
      {currentPrompt && (
        <div
          onMouseDown={startResize}
          style={{
            height: 6,
            width: '100%',
            cursor: 'ns-resize',
            background: isResizing
              ? 'rgba(56, 53, 209, 0.3)'
              : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.1s ease',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            zIndex: 11,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(56, 53, 209, 0.2)';
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }
          }}
        >
          {/* Grip dots */}
          <div style={{ display: 'flex', gap: 2 }}>
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
              }}
            />
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
              }}
            />
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
              }}
            />
          </div>
        </div>
      )}

      {/* INPUT SECTION - with dynamic height */}
      <div
        className="webcli-inputbar"
        style={{
          opacity: isInputDisabled ? 0.5 : 1,
          height: currentPrompt ? inputHeight : 80,
          transition: isResizing ? 'none' : 'height 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: currentPrompt ? '12px 16px' : '10px 16px',
          alignItems: 'flex-start',
          overflow: 'auto',
          pointerEvents: isStreamingLogs ? 'none' : 'auto',
        }}
      >
        {currentPrompt ? (
          <InputPromptWidget
            prompt={currentPrompt}
            onResponse={handlePromptResponse}
            onCancel={() => handlePromptResponse(null, true)}
          />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                gap: 6,
                width: '100%',
                position: 'relative',
              }}
            >
              <span className="webcli-prompt">$</span>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  className="webcli-input"
                  placeholder={
                    isStreamingLogs
                      ? 'Streaming logs... Press Ctrl+C to stop'
                      : 'Type a command...'
                  }
                  onKeyDown={handleKeyDown}
                  onChange={handleInputChange}
                  disabled={isStreamingLogs}
                  style={{
                    cursor: isStreamingLogs ? 'not-allowed' : 'text',
                    width: '100%',
                  }}
                />

                {/* Autocomplete suggestions dropdown */}
                {autocompleteSuggestions.length > 0 &&
                  showingSuggestionsRef.current && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        marginBottom: 4,
                        background: '#1a1f2e',
                        border: '1px solid #374151',
                        borderRadius: 6,
                        overflow: 'hidden',
                        zIndex: 1000,
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
                      }}
                    >
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <div
                          key={suggestion}
                          onClick={() => {
                            if (inputRef.current) {
                              inputRef.current.value = suggestion;
                              inputRef.current.focus();
                            }
                            setAutocompleteSuggestions([]);
                            showingSuggestionsRef.current = false;
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            background:
                              index === selectedSuggestionIndex
                                ? '#374151'
                                : 'transparent',
                            color:
                              index === selectedSuggestionIndex
                                ? '#60a5fa'
                                : '#9ca3af',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 13,
                            transition: 'background 0.1s ease',
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                color: '#F3F4F680',
                fontSize: 12,
                width: '100%',
              }}
            >
              {isStreamingLogs ? (
                <>
                  <span>Streaming logs</span>
                  <span>•</span>
                  <span>Ctrl+C to stop</span>
                </>
              ) : autocompleteSuggestions.length > 0 ? (
                <>
                  <span>Tab to autocomplete</span>
                  <span>•</span>
                  <span>↑↓ to navigate</span>
                  <span>•</span>
                  <span>Esc to cancel</span>
                </>
              ) : (
                <>
                  <span>Ctrl+C to copy</span>
                  <span>•</span>
                  <span>Ctrl+L to clear</span>
                  <span>•</span>
                  <span>↑↓ for history</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
