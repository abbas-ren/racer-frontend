import { Stack, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import styles from './TestCaseResult.module.scss';
import { clsx } from 'clsx';
import type { TestCaseEntryForLogs } from 'types/tests';

interface TestCaseResultProps {
  testCases: TestCaseEntryForLogs[];
  totalCases: number;
  startIndex?: number;
}

function TestCaseResult({
  testCases,
  totalCases,
  startIndex = 0,
}: TestCaseResultProps) {
  const completedCases = testCases.length;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const formatTime = (ts: string | undefined) => {
    if (!ts) return { time: '', title: '' };
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime())) {
      const time = d
        .toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        .toString();
      const title = d.toLocaleString();
      return { time, title };
    }
    const m = ts.match(/\b(\d{2}:\d{2}:\d{2})\b/);
    return { time: m ? m[1] : ts, title: ts };
  };

  // Auto-scroll to bottom when new test cases or results are added
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Scroll only if content overflows
    if (el.scrollHeight > el.clientHeight) {
      el.scrollTop = el.scrollHeight;
    }
  }, [completedCases]);

  return (
    <Stack className={styles.container} ref={containerRef}>
      <Stack className={styles.content}>
        {completedCases === 0 ? (
          <Typography
            variant="body3"
            color="text.disabled"
            alignSelf="center"
            marginTop="20px"
          >
            No logs yet. Run tests to see results.
          </Typography>
        ) : (
          testCases.map((tc, idx) => {
            const statusRaw = (tc.result ?? '').toString().toUpperCase();
            const status =
              statusRaw === 'PASS' || statusRaw === 'PASSED'
                ? 'passed'
                : 'failed';
            const id = `${tc.suiteId}-${tc.testCaseId}-${idx}`;
            const t = formatTime(tc.updatedAt);
            return (
              <Stack
                key={id}
                direction="row"
                alignItems="center"
                className={clsx([
                  styles.resultItem,
                  status === 'passed' && styles.resultItemPassed,
                  status === 'failed' && styles.resultItemFailed,
                ])}
              >
                <Typography
                  component="span"
                  className={styles.timestamp}
                  variant="body4"
                  title={t.title}
                >
                  [{t.time}]
                </Typography>
                <Typography component="span" variant="body4">
                  Test case {startIndex + idx + 1}/{totalCases} {status}
                  {tc.title && ` - ${tc.title}`}
                </Typography>
              </Stack>
            );
          })
        )}
      </Stack>
    </Stack>
  );
}

export default TestCaseResult;
