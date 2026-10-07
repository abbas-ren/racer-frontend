import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type {
  RelayDeviceOption,
  UartConfigurationRequest,
  UartConfigurationResult,
} from 'types/configuration';

interface ConfigureUartDialogProps {
  open: boolean;
  controllerId: string;
  generation: string;
  devices: RelayDeviceOption[];
  fixedDevice?: RelayDeviceOption;
  relayId?: string;
  channelId?: string;
  isLoadingDevices?: boolean;
  onClose: () => void;
  onConfigure: (
    request: UartConfigurationRequest,
  ) => Promise<UartConfigurationResult>;
}

const ConfigureUartDialog = ({
  open,
  controllerId,
  generation,
  devices,
  fixedDevice,
  relayId,
  channelId,
  isLoadingDevices = false,
  onClose,
  onConfigure,
}: ConfigureUartDialogProps) => {
  const [deviceId, setDeviceId] = useState('');
  const [vidPid, setVidPid] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UartConfigurationResult | null>(null);

  useEffect(() => {
    if (open) {
      setDeviceId(fixedDevice?.deviceId ?? '');
      setVidPid('');
      setError('');
      setResult(null);
      setIsVerifying(false);
    }
  }, [fixedDevice?.deviceId, open]);

  const normalizedVidPid = vidPid.trim().toLowerCase();
  const isValidVidPid = /^[0-9a-f]{4}:[0-9a-f]{4}$/.test(normalizedVidPid);

  const handleConfigure = async () => {
    if (!deviceId || !isValidVidPid) {
      setError(
        'Select a device and enter VID:PID as four hex digits on each side.',
      );
      return;
    }

    setError('');
    setResult(null);
    setIsVerifying(true);
    try {
      setResult(
        await onConfigure({
          controllerId,
          deviceId,
          relayId,
          channelId,
          uartVidPid: normalizedVidPid,
        }),
      );
    } catch (caught: unknown) {
      const response = caught as {
        response?: { data?: { message?: string; error?: string } };
      };
      setError(
        response.response?.data?.message ??
          response.response?.data?.error ??
          'UART verification failed.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isVerifying ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6">Configure UART</Typography>
            <Typography variant="caption" color="text.secondary">
              {generation} · {controllerId}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={isVerifying}
            aria-label="Close UART configuration"
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={1}>
          {fixedDevice ? (
            <TextField
              label="Device"
              value={`${fixedDevice.deviceType} - ${fixedDevice.macAddress}`}
              disabled
            />
          ) : (
            <Select
              value={deviceId}
              displayEmpty
              disabled={isLoadingDevices || isVerifying}
              onChange={(event) => setDeviceId(event.target.value)}
            >
              <MenuItem value="" disabled>
                {isLoadingDevices ? 'Loading devices...' : 'Select device'}
              </MenuItem>
              {devices.map((device) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {device.deviceType} - {device.macAddress}
                </MenuItem>
              ))}
            </Select>
          )}
          <TextField
            label="UART VID:PID"
            value={vidPid}
            placeholder="0403:6010"
            disabled={isVerifying}
            error={Boolean(vidPid) && !isValidVidPid}
            onChange={(event) => setVidPid(event.target.value)}
          />
          {isVerifying ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">
                Power-cycling and verifying USB topology...
              </Typography>
            </Stack>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {result ? (
            <Alert severity="success">
              <Typography variant="body2">{result.tty}</Typography>
              <Typography variant="caption" display="block">
                {result.vidPid} · {result.connection} · interface{' '}
                {result.interface}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{ wordBreak: 'break-all' }}
              >
                {result.topology}
              </Typography>
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isVerifying}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfigure}
          disabled={isVerifying || !deviceId || !isValidVidPid}
        >
          Verify UART
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureUartDialog;
