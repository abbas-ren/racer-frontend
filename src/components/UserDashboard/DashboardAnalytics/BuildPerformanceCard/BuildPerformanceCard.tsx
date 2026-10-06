import {
  Box,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import type { UserBuildComparisonData } from 'typesCustom/analytics';
import styles from './BuildPerformanceCard.module.scss';

interface DashboardBuildPerformance {
  id: string;
  build: string;
  score: number;
  tests: number;
  avgTime: string;
  tone: 'green' | 'orange' | 'red';
}

interface BuildPerformanceCardProps {
  buildsComparison: UserBuildComparisonData[];
}

const getToneFromScore = (score: number): DashboardBuildPerformance['tone'] => {
  if (score > 95) return 'green';
  if (score >= 90) return 'orange';
  return 'red';
};

const getBuildToneColor = (
  tone: DashboardBuildPerformance['tone'],
  success: string,
  warning: string,
  error: string,
) => {
  if (tone === 'green') return success;
  if (tone === 'orange') return warning;
  return error;
};

const formatAverageExecutionTime = (milliseconds: number) => {
  const safeMs = Math.max(0, milliseconds || 0);
  const totalSeconds = Math.floor(safeMs / 1000);

  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.floor(totalSeconds / 60)}m`;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

function BuildPerformanceCard({ buildsComparison }: BuildPerformanceCardProps) {
  const theme = useTheme();

  const recentBuildPerformanceData: DashboardBuildPerformance[] =
    buildsComparison.length === 0
      ? []
      : [...buildsComparison]
          .sort(
            (left, right) =>
              (right.passedPercentage || 0) - (left.passedPercentage || 0),
          )
          .slice(0, 3)
          .map((build, index) => {
            const score = Number((build.passedPercentage || 0).toFixed(1));
            const totalTests = Math.max(0, build.totalTestCases || 0);

            return {
              id: `build-${index + 1}-${build.buildId}`,
              build: build.deviceType
                ? `${build.deviceType}-${build.buildVersion || build.buildId}`
                : build.buildVersion || build.buildId,
              score,
              tests: totalTests,
              avgTime: formatAverageExecutionTime(build.averageDuration || 0),
              tone: getToneFromScore(score),
            };
          });

  return (
    <Box className={styles.card}>
      <Stack
        className={styles.header}
        direction="row"
        justifyContent="space-between"
      >
        <Typography variant="h6" className={styles.title}>
          Build Version Performance
        </Typography>
      </Stack>

      <Stack className={styles.list}>
        {recentBuildPerformanceData.map((build) => {
          const toneColor = getBuildToneColor(
            build.tone,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main,
          );

          return (
            <Stack key={build.id} className={styles.item}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                className={styles.itemHeaderRow}
              >
                <Stack direction="row" alignItems="center" gap="0.4rem">
                  <CustomIcon
                    name="package"
                    size={16}
                    color={theme.palette.primary[300]}
                  />
                  <Typography variant="body1" className={styles.buildTitle}>
                    {build.build}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  className={styles.scoreText}
                  sx={{ color: toneColor, fontWeight: 700 }}
                >
                  {build.score}%
                </Typography>
              </Stack>
              <LinearProgress
                className={styles.progress}
                variant="determinate"
                value={build.score}
                sx={{
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: toneColor,
                  },
                }}
              />
              <Stack
                className={styles.metricsRow}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack
                  className={styles.metricGroup}
                  direction="row"
                  alignItems="center"
                >
                  <Typography className={styles.metricLabel}>Tests:</Typography>
                  <Typography className={styles.metricValue}>
                    {build.tests}
                  </Typography>
                </Stack>
                <Stack
                  className={styles.metricGroup}
                  direction="row"
                  alignItems="center"
                >
                  <Typography className={styles.metricLabel}>
                    Avg Time:
                  </Typography>
                  <Typography className={styles.metricValue}>
                    {build.avgTime}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

export default BuildPerformanceCard;
