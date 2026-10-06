import { Box, Stack, Typography, useTheme } from '@mui/material';
import { useMemo } from 'react';
import { DeviceState } from 'typesCustom/components';
import { getDeviceStateColor, getDeviceStateLabel } from 'utils/dashboard';

function StatusLabel({ type }: { type: DeviceState }) {
  const theme = useTheme();
  const color = useMemo(
    () => getDeviceStateColor({ type, theme }),
    [type, theme],
  );
  const label = useMemo(() => getDeviceStateLabel({ type }), [type]);

  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      gap="0.5rem"
    >
      <Box
        bgcolor={color}
        width="0.75rem"
        height="0.75rem"
        borderRadius="0.25rem"
      />
      <Typography variant="buttonBase" color={color}>
        {label}
      </Typography>
    </Stack>
  );
}

export default StatusLabel;
