import { Stack, Typography, Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import styles from './CommonLogs.module.scss';

interface CommonLogsProps {
  logs: string[];
}

function parseTimeFromLog(msg: string) {
  // Allow leading whitespace before the timestamp and capture message with newlines
  const input = msg.replace(/^\s+/, '');
  const iso = input.match(
    /^\s*\[?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\]?\s*([\s\S]*)$/,
  );
  if (iso) {
    const full = iso[1];
    const rest = iso[2] || msg;
    const d = new Date(full);
    if (!Number.isNaN(d.getTime())) {
      const time = d
        .toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        .toString();
      return { time, title: d.toLocaleString(), message: rest } as const;
    }
    return { time: full, title: full, message: rest } as const;
  }
  const hhmmss = input.match(/^\s*\[(\d{2}:\d{2}:\d{2})\]\s*([\s\S]*)$/);
  if (hhmmss) {
    return {
      time: hhmmss[1],
      title: hhmmss[1],
      message: hhmmss[2] || msg,
    } as const;
  }
  return { time: '', title: '', message: msg } as const;
}

function CommonLogs({ logs }: CommonLogsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logCount = logs?.length ?? 0;

  // Auto-scroll to bottom when new logs arrive and content overflows
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollHeight > el.clientHeight) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logCount]);

  if (!logs || logs.length === 0) {
    return (
      <Stack className={styles.emptyContainer}>
        <Typography
          variant="body3"
          color="text.disabled"
          alignSelf="center"
          marginTop="20px"
        >
          No logs yet. Run tests to see results.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack className={styles.container} ref={containerRef}>
      <Stack className={styles.content}>
        {logs.map((raw, idx) => {
          const { time, title, message } = parseTimeFromLog(raw);
          const normalizedMessage = message
            .replace(/\\r\\n?/g, '\n')
            .replace(/\\n/g, '\n');
          return (
            <Box key={`log-${idx}`} className={styles.logEntry}>
              <Typography
                component="span"
                className={styles.timestamp}
                title={title}
                variant="caption"
              >
                {time ? `[${time}]` : ''}
              </Typography>{' '}
              <Typography
                component="span"
                className={styles.logText}
                variant="body4"
              >
                {normalizedMessage}
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}

export default CommonLogs;
