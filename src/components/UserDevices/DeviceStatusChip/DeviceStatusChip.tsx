import { Chip, Typography, useTheme } from '@mui/material';
import { DeviceState } from 'typesCustom/components';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './DeviceStatusChip.module.scss';

interface DeviceStatusChipProps {
  state?: string;
  upgrading?: boolean;
  flashing?: boolean;
}

function DeviceStatusChip({
  state,
  upgrading,
  flashing,
}: DeviceStatusChipProps) {
  const theme = useTheme();

  if (flashing) {
    return (
      <Chip
        icon={
          <CustomIcon
            name="zap"
            size={14}
            color={theme.palette.primary[400]}
            variant="filled"
            className={styles.statusChipIcon}
          />
        }
        label={
          <Typography className={styles.statusChipText}>Flashing</Typography>
        }
        size="small"
        className={styles.statusChip}
        sx={{
          color: (t) => t.palette.primary[400],
          border: (t) => `1px solid ${t.palette.primary[300]}`,
          backgroundColor: (t) => t.palette.primary[100],
        }}
      />
    );
  }

  if (upgrading) {
    return (
      <Chip
        icon={
          <CustomIcon
            name="zap"
            size={14}
            color={theme.palette.primary[400]}
            variant="filled"
            className={styles.statusChipIcon}
          />
        }
        label={
          <Typography className={styles.statusChipText}>Upgrading</Typography>
        }
        size="small"
        className={styles.statusChip}
        sx={{
          color: (t) => t.palette.primary[400],
          border: (t) => `1px solid ${t.palette.primary[300]}`,
          backgroundColor: (t) => t.palette.primary[100],
        }}
      />
    );
  }

  if (!state) return null;

  if (state === DeviceState.AVAILABLE) {
    return (
      <Chip
        icon={
          <CustomIcon
            name="circle-check"
            size={14}
            color={theme.palette.success.main}
            className={styles.statusChipIcon}
          />
        }
        label={
          <Typography className={styles.statusChipText}>Available</Typography>
        }
        size="small"
        className={styles.statusChip}
        sx={{
          color: 'success.main',
          border: (t) => `1px solid ${t.palette.success[20]}`,
          backgroundColor: (t) => t.palette.success[10],
        }}
      />
    );
  }

  if (state === DeviceState.BUSY) {
    return (
      <Chip
        icon={
          <CustomIcon
            name="circle"
            size={14}
            color={theme.palette.warning.main}
            variant="filled"
            className={styles.statusChipIcon}
          />
        }
        label={<Typography className={styles.statusChipText}>Busy</Typography>}
        size="small"
        className={styles.statusChip}
        sx={{
          color: 'warning.main',
          border: (t) => `1px solid ${t.palette.warning[20]}`,
          backgroundColor: (t) => t.palette.warning[10],
        }}
      />
    );
  }

  if (state === DeviceState.FAULTY) {
    return (
      <Chip
        icon={
          <CustomIcon
            name="circle-x"
            size={14}
            color={theme.palette.error.main}
            className={styles.statusChipIcon}
          />
        }
        label={
          <Typography className={styles.statusChipText}>Faulty</Typography>
        }
        size="small"
        className={styles.statusChip}
        sx={{
          color: 'error.main',
          border: (t) => `1px solid ${t.palette.error[20]}`,
          backgroundColor: (t) => t.palette.error[10],
        }}
      />
    );
  }

  if (state === DeviceState.NOT_REACHABLE) {
    return (
      <Chip
        icon={
          <CustomIcon
            name="circle-x"
            size={14}
            color={theme.palette.error.main}
            className={styles.statusChipIcon}
          />
        }
        label={
          <Typography className={styles.statusChipText}>
            Not Reachable
          </Typography>
        }
        size="small"
        className={styles.statusChip}
        sx={{
          color: 'error.main',
          border: (t) => `1px solid ${t.palette.error[20]}`,
          backgroundColor: (t) => t.palette.error[10],
        }}
      />
    );
  }

  return null;
}

export default DeviceStatusChip;
