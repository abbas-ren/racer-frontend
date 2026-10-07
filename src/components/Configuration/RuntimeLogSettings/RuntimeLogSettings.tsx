import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { Save, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchRuntimeLogs,
  updateRuntimeLogLevel,
} from 'services/runtimeLogsApiService';
import toastService from 'services/ToastService';
import type { ControllerRow } from 'types/configuration';
import type { RuntimeLogLevel, RuntimeLogSource } from 'types/runtimeLogs';
import styles from './RuntimeLogSettings.module.scss';

const LEVELS: RuntimeLogLevel[] = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'off',
];

interface RuntimeLogSettingsProps {
  controllers: ControllerRow[];
}

const RuntimeLogSettings = ({ controllers }: RuntimeLogSettingsProps) => {
  const [source, setSource] = useState<RuntimeLogSource>('farmcontroller');
  const [controllerId, setControllerId] = useState('');
  const [level, setLevel] = useState<RuntimeLogLevel>('info');
  const [savedLevel, setSavedLevel] = useState<RuntimeLogLevel>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReachable, setIsReachable] = useState<boolean | null>(null);

  const context = useMemo(
    () => ({
      source,
      controllerId: source === 'edgecontroller' ? controllerId : undefined,
    }),
    [controllerId, source],
  );

  useEffect(() => {
    if (source === 'edgecontroller' && !controllerId) {
      setIsReachable(null);
      return;
    }
    let active = true;
    setIsLoading(true);
    fetchRuntimeLogs(context, 1)
      .then((response) => {
        if (!active) {
          return;
        }
        const current = LEVELS.includes(response.level as RuntimeLogLevel)
          ? (response.level as RuntimeLogLevel)
          : 'info';
        setLevel(current);
        setSavedLevel(current);
        setIsReachable(true);
      })
      .catch(() => {
        if (active) {
          setIsReachable(false);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [context, controllerId, source]);

  const apply = async () => {
    setIsSaving(true);
    try {
      const saved = await updateRuntimeLogLevel(context, level);
      const normalized = LEVELS.includes(saved as RuntimeLogLevel)
        ? (saved as RuntimeLogLevel)
        : level;
      setLevel(normalized);
      setSavedLevel(normalized);
      setIsReachable(true);
      toastService.success(`Runtime logging changed to ${normalized}`);
    } catch {
      setIsReachable(false);
      toastService.error('Unable to update runtime logging');
    } finally {
      setIsSaving(false);
    }
  };

  const requiresController = source === 'edgecontroller' && !controllerId;

  return (
    <Box className={styles.root}>
      <Box className={styles.heading}>
        <SlidersHorizontal size={19} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Runtime logging
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Change service verbosity without restarting the process.
          </Typography>
        </Box>
      </Box>

      <Stack className={styles.controls} direction="row" spacing={1}>
        <FormControl size="small" className={styles.control}>
          <InputLabel id="settings-log-source">Service</InputLabel>
          <Select
            labelId="settings-log-source"
            label="Service"
            value={source}
            onChange={(event) => {
              setSource(event.target.value as RuntimeLogSource);
              setIsReachable(null);
            }}
          >
            <MenuItem value="farmcontroller">FarmController</MenuItem>
            <MenuItem value="edgecontroller">EdgeController</MenuItem>
          </Select>
        </FormControl>

        {source === 'edgecontroller' && (
          <FormControl size="small" className={styles.controllerControl}>
            <InputLabel id="settings-edge-controller">Controller</InputLabel>
            <Select
              labelId="settings-edge-controller"
              label="Controller"
              value={controllerId}
              onChange={(event) => setControllerId(event.target.value)}
            >
              {controllers.map((controller) => (
                <MenuItem
                  key={controller.controllerId}
                  value={controller.controllerId}
                >
                  {controller.controllerName} · {controller.ipAddress}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" className={styles.levelControl}>
          <InputLabel id="settings-log-level">Level</InputLabel>
          <Select
            labelId="settings-log-level"
            label="Level"
            value={level}
            disabled={requiresController || isLoading}
            onChange={(event) =>
              setLevel(event.target.value as RuntimeLogLevel)
            }
          >
            {LEVELS.map((option) => (
              <MenuItem key={option} value={option}>
                {option.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Chip
          size="small"
          variant="outlined"
          color={isReachable === false ? 'error' : 'success'}
          label={
            isLoading
              ? 'Checking'
              : isReachable === false
                ? 'Unavailable'
                : isReachable
                  ? 'Connected'
                  : 'Not selected'
          }
          className={styles.status}
        />

        <Button
          variant="contained"
          startIcon={
            isSaving ? <CircularProgress size={16} /> : <Save size={16} />
          }
          disabled={
            requiresController || isLoading || isSaving || level === savedLevel
          }
          onClick={() => void apply()}
          className={styles.saveButton}
        >
          Apply
        </Button>
      </Stack>
    </Box>
  );
};

export default RuntimeLogSettings;
