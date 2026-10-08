import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import TerminalComponent from 'components/Terminal/Terminal';
import { Eye, EyeOff, Plug, Server, SquareTerminal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchAllDeviceControllers } from 'services/deviceControllerAPIService';
import toastService from 'services/ToastService';
import type { DeviceControllerItem } from 'types/deviceController';
import styles from './Terminals.module.scss';

type TerminalHost = 'farmcontroller' | 'edgecontroller';

interface TerminalCredentials {
  target: string;
  username: string;
  password: string;
  session: number;
}

const Terminals = () => {
  const [host, setHost] = useState<TerminalHost>('farmcontroller');
  const [controllers, setControllers] = useState<DeviceControllerItem[]>([]);
  const [controller, setController] = useState<DeviceControllerItem | null>(
    null,
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<TerminalCredentials | null>(
    null,
  );

  useEffect(() => {
    fetchAllDeviceControllers({ page: 1, limit: 100 })
      .then((response) => setControllers(response.data ?? []))
      .catch(() => toastService.error('Failed to load EdgeControllers'));
  }, []);

  const target =
    host === 'farmcontroller' ? 'farmcontroller' : controller?.ipAddress;

  const connect = () => {
    if (!target || !username.trim()) return;
    setCredentials({
      target,
      username: username.trim(),
      password,
      session: Date.now(),
    });
  };

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
          onChange={(_, value: TerminalHost) => {
            setHost(value);
            setCredentials(null);
          }}
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
            onChange={(_, value) => {
              setController(value);
              setCredentials(null);
            }}
            getOptionLabel={(option) =>
              `${option.name || option.deviceControllerId} · ${option.ipAddress}`
            }
            renderInput={(params) => (
              <TextField {...params} label="EdgeController host" />
            )}
          />
        )}
      </Box>

      <Box className={styles.credentialsBand}>
        <TextField
          size="small"
          label="SSH username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          inputProps={{ maxLength: 64 }}
        />
        <TextField
          size="small"
          label="SSH password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          inputProps={{ maxLength: 1024 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  edge="end"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') connect();
          }}
        />
        <Button
          variant="contained"
          startIcon={<Plug size={17} />}
          onClick={connect}
          disabled={!target || !username.trim()}
        >
          Connect
        </Button>
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
          {credentials ? (
            <TerminalComponent
              key={`${host}:${credentials.target}:${credentials.session}`}
              target={credentials.target}
              adminTerminal
              username={credentials.username}
              password={credentials.password}
            />
          ) : (
            <Box className={styles.emptyState}>
              <Typography color="text.secondary">
                Enter host credentials and connect to open an SSH terminal.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Terminals;
