import { Box, Stack, Typography, useTheme } from '@mui/material';
import styles from './DeviceStateCard.module.scss';
import { getPercentage } from 'utils/common';
import { useMemo } from 'react';
import { DeviceStateCardProps } from 'typesCustom/components';
import { getDeviceStateColor, getDeviceStateLabel } from 'utils/dashboard';

function DeviceStateCard({ type, data }: DeviceStateCardProps) {
  const theme = useTheme();
  const color = useMemo(
    () => getDeviceStateColor({ type, theme }),
    [type, theme],
  );
  const label = useMemo(() => getDeviceStateLabel({ type }), [type]);
  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      className={styles.container}
    >
      <Box className={styles.outerLayer} />
      <Box className={styles.circleLayer} />
      <Stack
        className={styles['progress-circle']}
        justifyContent="center"
        alignItems="center"
      >
        <Stack
          className={styles.circle}
          justifyContent="center"
          alignItems="center"
          sx={{
            background: `conic-gradient(
                  ${color} ${getPercentage(data)}%,
                  ${theme.palette.background.default} 0%
                )`,
          }}
        >
          <Typography component="span" variant="label1">
            {getPercentage(data)}%
          </Typography>
        </Stack>
      </Stack>
      <Stack className={styles.details}>
        <Typography
          variant="caption"
          fontSize={'0.75rem'}
          color="button.disabled.text"
        >
          {label}&nbsp;Devices
        </Typography>
        <Typography color={color} variant="h5">
          {data.current}/{data.total}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default DeviceStateCard;
