import { Box, Stack, Typography, useTheme } from '@mui/material';
import styles from './UploadProgress.module.scss';

export interface UploadProgressProps {
  progress: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  filesTotal?: number;
  filesInProgress?: number;
  message?: string;
  color?: string; // CSS color string
  trackColor?: string; // CSS color string
}

const clamp = (v: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, v));

const UploadProgress = ({
  progress,
  size = 48,
  strokeWidth = 4,
  filesTotal,
  filesInProgress,
  message,
  color,
  trackColor,
}: UploadProgressProps) => {
  const theme = useTheme();

  if (!color) {
    color = theme.palette.primary[300];
  }
  if (!trackColor) {
    trackColor = theme.palette.grey[200];
  }
  const p = clamp(progress);
  const r = Math.max(2, size / 2 - strokeWidth - 2);
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashArray = circumference;
  const dashOffset = circumference * (1 - p / 100);

  const filesLabel = (() => {
    if (message) return message;
    const count =
      typeof filesInProgress === 'number' ? filesInProgress : (filesTotal ?? 0);
    return `Uploading ${count} ${count === 1 ? 'file' : 'files'}...`;
  })();
  const subLabel = (() => {
    if (typeof filesInProgress === 'number')
      return `${filesInProgress} in progress`;
    return filesTotal ? `${filesTotal} selected` : '';
  })();

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      className={styles.progressWrap}
    >
      <Box className={styles.ringWrap} sx={{ width: size, height: size }}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <Box className={styles.centerText}>
          <Typography variant="caption" className={styles.percentText}>
            {Math.round(p)}%
          </Typography>
        </Box>
      </Box>

      <Box className={styles.textCol}>
        <Box className={styles.textRow}>
          <Typography variant="system2" className={styles.textPrimary}>
            {filesLabel}
          </Typography>
        </Box>
        {subLabel && (
          <Typography variant="caption" className={styles.textSecondary}>
            {subLabel}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default UploadProgress;
