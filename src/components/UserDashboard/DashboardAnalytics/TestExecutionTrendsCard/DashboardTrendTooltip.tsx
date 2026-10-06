import { Box, Stack, Typography } from '@mui/material';
import type { TrendPoint } from '../../shared/testExecutionData';
import styles from './DashboardTrendTooltip.module.scss';

interface DashboardTrendTooltipEntry {
  dataKey?: string;
  value?: number | string;
  payload?: TrendPoint;
}

interface DashboardTrendTooltipProps {
  active?: boolean;
  payload?: DashboardTrendTooltipEntry[];
  label?: string;
}

function DashboardTrendTooltip({
  active,
  payload,
  label,
}: DashboardTrendTooltipProps) {
  if (!active || !payload?.length) return null;

  const passed = Number(
    payload.find((item) => item.dataKey === 'passed')?.value ?? 0,
  );
  const failed = Number(
    payload.find((item) => item.dataKey === 'failed')?.value ?? 0,
  );
  const duration = Number(
    payload.find((item) => item.dataKey === 'durationMinutes')?.value ?? 0,
  );
  const selectedPoint = payload.find((item) => item.payload)?.payload;

  const count = selectedPoint?.total ?? passed + failed;

  return (
    <Box className={styles.tooltip}>
      <Typography className={styles.title}>{label}</Typography>
      <Stack>
        <Stack direction="row" alignItems="center" className={styles.statsRow}>
          <Typography component="span" className={styles.statPassed}>
            {`• Passed:${passed}`}
          </Typography>
          <Typography component="span" className={styles.statFailed}>
            {`• Failed:${failed}`}
          </Typography>
          <Typography component="span" className={styles.statDuration}>
            {`• Duration:${duration} min`}
          </Typography>
        </Stack>
        <Typography component="span" className={styles.statDuration}>
          {`TEST EXECUTIONS (${count})`}
        </Typography>
      </Stack>
      {/* 
      <Box className={styles.executions}>
        <Typography
          className={styles.executionsTitle}
        >{`TEST EXECUTIONS (${executions.length})`}</Typography>
        <Box className={clsx(styles.executionsGrid, executionsGridClassName)}>
          {executions.map((execution: TrendExecutionPreview) => (
            <Box key={execution.id} className={styles.executionCard}>
              <Typography
                className={styles.executionTitle}
              >{`${execution.deviceName} - ${execution.testPlanName}`}</Typography>
              <Typography
                className={styles.executionMeta}
              >{`P: ${execution.passed} | F: ${execution.failed} | D: ${execution.durationMinutes}m`}</Typography>
            </Box>
          ))}
        </Box>
      </Box> */}
    </Box>
  );
}

export default DashboardTrendTooltip;
