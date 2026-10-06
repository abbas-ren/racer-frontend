import React, { useMemo } from 'react';
import { Stack, Typography } from '@mui/material';
import clsx from 'clsx';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import { TestStatus } from 'typesCustom/tests';
import styles from './ExecutionStatusBadge.module.scss';

interface ExecutionStatusBadgeProps {
  execution?: { testId: string; status: TestStatus };
  size?: 'small' | 'medium' | 'large';
  textCase?: 'uppercase' | 'sentence';
}

type IconName = 'check' | 'clock' | 'ban' | 'x' | 'circle';

interface StatusConfig {
  icon: IconName;
  label: string;
  className: string;
}

const STATUS_CONFIG: Partial<Record<TestStatus, StatusConfig>> & {
  default: StatusConfig;
} = {
  [TestStatus.COMPLETED]: {
    icon: 'check',
    label: 'Completed',
    className: 'completed',
  },
  [TestStatus.IN_PROGRESS]: {
    icon: 'clock',
    label: 'Running',
    className: 'running',
  },
  [TestStatus.QUEUED]: {
    icon: 'clock',
    label: 'Queued',
    className: 'queued',
  },
  [TestStatus.CANCELLED]: {
    icon: 'circle',
    label: 'Ready',
    className: 'ready',
  },
  [TestStatus.FAILED]: {
    icon: 'x',
    label: 'Failed',
    className: 'failed',
  },
  default: {
    icon: 'circle',
    label: 'Ready',
    className: 'ready',
  },
};

const SIZE_CONFIG = {
  small: 8,
  medium: 10,
  large: 12,
} as const;

const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({
  execution,
  size = 'medium',
  textCase = 'uppercase',
}) => {
  const statusConfig = useMemo(() => {
    const config = execution?.status
      ? STATUS_CONFIG[execution.status] || STATUS_CONFIG.default
      : STATUS_CONFIG.default;

    return {
      ...config,
      label:
        textCase === 'uppercase' ? config.label.toUpperCase() : config.label,
    };
  }, [execution?.status, textCase]);

  return (
    <Stack
      direction="row"
      className={clsx(
        styles.badge,
        styles[statusConfig.className],
        styles[size],
      )}
    >
      <span className={styles.icon} style={{ color: 'inherit' }}>
        <CustomIcon
          name={statusConfig.icon}
          size={SIZE_CONFIG[size]}
          className={styles.icon}
        />
      </span>
      <Typography className={styles.label}>{statusConfig.label}</Typography>
    </Stack>
  );
};

export default ExecutionStatusBadge;
