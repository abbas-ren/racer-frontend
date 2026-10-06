import { Box, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';

function Logs() {
  const { logs, selectedTestExecution } = useSelector(
    (state: RootState) => state.tests,
  );
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedTestExecution && logs[selectedTestExecution.testId]) {
      setTestLogs(logs[selectedTestExecution.testId]);
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setTestLogs([]);
    }
  }, [logs, selectedTestExecution]);

  return (
    <Stack className="ud-logs">
      {testLogs.length === 0 ? (
        <Typography
          className="ud-logs-empty"
          variant="h6"
          color="text.subtitle"
        >
          No Logs available
        </Typography>
      ) : (
          <Stack className="ud-logs-list">
          {testLogs.map((log, index) => (
            <Typography key={index} variant="body3">
              {log}
            </Typography>
          ))}
          <Box ref={logEndRef} />
        </Stack>
      )}
    </Stack>
  );
}

export default Logs;
