import {
  Autocomplete,
  Box,
  Chip,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import TerminalComponent from 'components/Terminal/Terminal';
import { Server, SquareTerminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchAllDeviceControllers } from 'services/deviceControllerAPIService';
import toastService from 'services/ToastService';
import type { DeviceControllerItem } from 'types/deviceController';
import styles from './Terminals.module.scss';

type TerminalHost = 'farmcontroller' | 'edgecontroller';

const Terminals = () => {
  const [host, setHost] = useState<TerminalHost>('farmcontroller');
  const [controllers, setControllers] = useState<DeviceControllerItem[]>([]);
  const [controller, setController] = useState<DeviceControllerItem | null>(
    null,
  );

  useEffect(() => {
    fetchAllDeviceControllers({ page: 1, limit: 100 })
      .then((response) => setControllers(response.data ?? []))
      .catch(() => toastService.error('Failed to load EdgeControllers'));
  }, []);

  const target =
    host === 'farmcontroller' ? 'farmcontroller' : controller?.ipAddress;

  return (
    <Box className={styles.pageRoot}>
      <Box className={styles.headingRow}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SquareTerminal size={22} />
            <Typography variant="h5" component="h1" fontWeight={700}>
              Host terminals
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            SSH sessions are brokered and authorized by FarmController
          </Typography>
        </Box>
        <Chip
          icon={<Server size={15} />}
          label={
            host === 'farmcontroller'
              ? 'FarmController host'
              : controller?.name || controller?.ipAddress || 'Select a host'
          }
          size="small"
          variant="outlined"
        />
      </Box>

      <Box className={styles.hostBand}>
        <Tabs
          value={host}
          onChange={(_, value: TerminalHost) => setHost(value)}
          aria-label="Terminal host type"
        >
          <Tab value="farmcontroller" label="FarmController" />
          <Tab value="edgecontroller" label="EdgeControllers" />
        </Tabs>
        {host === 'edgecontroller' && (
          <Autocomplete
            size="small"
            options={controllers}
            value={controller}
            onChange={(_, value) => setController(value)}
            getOptionLabel={(option) =>
              `${option.name || option.deviceControllerId} · ${option.ipAddress}`
            }
            renderInput={(params) => (
              <TextField {...params} label="EdgeController host" />
            )}
          />
        )}
      </Box>

      <Box className={styles.terminalShell}>
        <Box className={styles.terminalBar}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box className={styles.connectionIndicator} />
            <Typography variant="body2" fontWeight={600}>
              {target ?? 'No host selected'}
            </Typography>
          </Stack>
          <Typography variant="caption">SSH via FarmController</Typography>
        </Box>
        <Box className={styles.terminalViewport}>
          {target ? (
            <TerminalComponent
              key={`${host}:${target}`}
              target={target}
              adminTerminal
            />
          ) : (
            <Box className={styles.emptyState}>
              <Typography color="text.secondary">
                Select an EdgeController to open its host terminal.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Terminals;
