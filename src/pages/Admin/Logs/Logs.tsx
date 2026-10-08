import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import Fuse from 'fuse.js';
import { ChevronDown, ChevronRight, RefreshCw, Save } from 'lucide-react';
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchAllDeviceControllers } from 'services/deviceControllerAPIService';
import {
  fetchDevicesForTopologyApi,
  type TopologyDevice,
} from 'services/deviceApiService';
import {
  fetchRuntimeLogs,
  updateRuntimeLogLevel,
} from 'services/runtimeLogsApiService';
import toastService from 'services/ToastService';
import type { DeviceControllerItem } from 'types/deviceController';
import type {
  RuntimeLogEntry,
  RuntimeLogLevel,
  RuntimeLogSource,
} from 'types/runtimeLogs';
import styles from './Logs.module.scss';

const LOG_LEVELS: RuntimeLogLevel[] = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'off',
];

const levelColor = (level: string) => {
  switch (level) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    case 'debug':
      return 'success';
    default:
      return 'default';
  }
};

const normalizeLevel = (level: string): RuntimeLogLevel =>
  LOG_LEVELS.includes(level as RuntimeLogLevel)
    ? (level as RuntimeLogLevel)
    : 'info';

const searchableFields = (entry: RuntimeLogEntry) =>
  Object.entries(entry.fields)
    .map(([key, value]) => `${key} ${String(value)}`)
    .join(' ');

const Logs = () => {
  const theme = useTheme();
  const [source, setSource] = useState<RuntimeLogSource>('farmcontroller');
  const [controllers, setControllers] = useState<DeviceControllerItem[]>([]);
  const [controller, setController] = useState<DeviceControllerItem | null>(
    null,
  );
  const [devices, setDevices] = useState<TopologyDevice[]>([]);
  const [device, setDevice] = useState<TopologyDevice | null>(null);
  const [logs, setLogs] = useState<RuntimeLogEntry[]>([]);
  const [captureLevel, setCaptureLevel] = useState<RuntimeLogLevel>('info');
  const [pendingLevel, setPendingLevel] = useState<RuntimeLogLevel>('info');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingLevel, setIsSavingLevel] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    fetchAllDeviceControllers({ page: 1, limit: 100 })
      .then((response) => {
        if (active) {
          setControllers(response.data ?? []);
        }
      })
      .catch(() => {
        if (active) {
          toastService.error('Failed to load EdgeControllers');
        }
      });
    fetchDevicesForTopologyApi()
      .then((response) => {
        if (active) {
          setDevices(response.data ?? []);
        }
      })
      .catch(() => {
        if (active) {
          toastService.error('Failed to load EdgeAgent devices');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const context = useMemo(
    () => ({
      source,
      controllerId:
        source === 'edgecontroller'
          ? controller?.deviceControllerId
          : undefined,
      deviceId: source === 'edgeagent' ? device?.deviceId : undefined,
    }),
    [controller?.deviceControllerId, device?.deviceId, source],
  );

  const refresh = useCallback(
    async (showLoading = false) => {
      if (source === 'edgecontroller' && !controller) {
        setLogs([]);
        setError(null);
        return;
      }
      if (source === 'edgeagent' && !device) {
        setLogs([]);
        setError(null);
        return;
      }
      if (showLoading) {
        setIsLoading(true);
      }
      try {
        const response = await fetchRuntimeLogs(context);
        const level = normalizeLevel(response.level);
        setLogs(response.logs ?? []);
        setCaptureLevel(level);
        setPendingLevel(level);
        setError(null);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Failed to load runtime logs',
        );
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [context, controller, device, source],
  );

  useEffect(() => {
    void refresh(true);
    if (!isLive) {
      return;
    }
    const intervalId = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(intervalId);
  }, [isLive, refresh]);

  const indexedLogs = useMemo(
    () =>
      logs.map((entry) => ({
        entry,
        fields: searchableFields(entry),
      })),
    [logs],
  );

  const logFuse = useMemo(
    () =>
      new Fuse(indexedLogs, {
        keys: ['entry.message', 'entry.target', 'fields'],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [indexedLogs],
  );

  const visibleLogs = useMemo(() => {
    if (!deferredQuery.trim()) {
      return logs.slice().reverse();
    }
    return logFuse
      .search(deferredQuery.trim(), { limit: 500 })
      .map((result) => result.item.entry);
  }, [deferredQuery, logFuse, logs]);

  const suggestions = useMemo(() => {
    const values = new Set<string>();
    logs.forEach((entry) => {
      values.add(entry.message);
      values.add(entry.target);
      Object.keys(entry.fields).forEach((key) => values.add(key));
    });
    return Array.from(values).filter(Boolean).slice(0, 500);
  }, [logs]);

  const suggestionFuse = useMemo(
    () =>
      new Fuse(suggestions, {
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [suggestions],
  );

  const applyLevel = async () => {
    if (source === 'edgecontroller' && !controller) {
      return;
    }
    if (source === 'edgeagent' && !device) {
      return;
    }
    setIsSavingLevel(true);
    try {
      const level = normalizeLevel(
        await updateRuntimeLogLevel(context, pendingLevel),
      );
      setCaptureLevel(level);
      setPendingLevel(level);
      toastService.success(`Capture level changed to ${level}`);
      await refresh();
    } catch (requestError) {
      toastService.error(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to update capture level',
      );
    } finally {
      setIsSavingLevel(false);
    }
  };

  const toggleExpanded = (sequence: number) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(sequence)) {
        next.delete(sequence);
      } else {
        next.add(sequence);
      }
      return next;
    });
  };

  const sourceUnavailable =
    (source === 'edgecontroller' && !controller) ||
    (source === 'edgeagent' && !device);

  return (
    <Box className={styles.pageRoot}>
      <Box className={styles.headingRow}>
        <Box>
          <Typography variant="h5" component="h1" fontWeight={700}>
            Runtime logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {visibleLogs.length} of {logs.length} buffered events
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={isLive}
                onChange={(event) => setIsLive(event.target.checked)}
                size="small"
              />
            }
            label="Live"
          />
          <Tooltip title="Refresh logs">
            <span>
              <Button
                aria-label="Refresh logs"
                variant="outlined"
                onClick={() => void refresh(true)}
                disabled={isLoading || sourceUnavailable}
                sx={{ minWidth: 40, width: 40, px: 0 }}
              >
                {isLoading ? (
                  <CircularProgress size={17} />
                ) : (
                  <RefreshCw size={17} />
                )}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      <Box className={styles.controlBand}>
        <FormControl size="small" className={styles.sourceControl}>
          <InputLabel id="log-source-label">Source</InputLabel>
          <Select
            labelId="log-source-label"
            label="Source"
            value={source}
            onChange={(event) => {
              setSource(event.target.value as RuntimeLogSource);
              setExpanded(new Set());
            }}
          >
            <MenuItem value="farmcontroller">FarmController</MenuItem>
            <MenuItem value="edgecontroller">EdgeController</MenuItem>
            <MenuItem value="edgeagent">EdgeAgent</MenuItem>
          </Select>
        </FormControl>

        {source === 'edgecontroller' && (
          <Autocomplete
            size="small"
            options={controllers}
            value={controller}
            onChange={(_, value) => setController(value)}
            getOptionLabel={(option) =>
              `${option.name || option.deviceControllerId} · ${option.ipAddress}`
            }
            isOptionEqualToValue={(option, value) =>
              option.deviceControllerId === value.deviceControllerId
            }
            renderInput={(params) => (
              <TextField {...params} label="EdgeController" />
            )}
            className={styles.controllerControl}
          />
        )}

        {source === 'edgeagent' && (
          <Autocomplete
            size="small"
            options={devices}
            value={device}
            onChange={(_, value) => setDevice(value)}
            getOptionLabel={(option) =>
              `${option.deviceName || option.deviceId} · ${option.deviceId} · ${option.ipAddress}`
            }
            isOptionEqualToValue={(option, value) =>
              option.deviceId === value.deviceId
            }
            renderInput={(params) => (
              <TextField {...params} label="EdgeAgent device" />
            )}
            className={styles.controllerControl}
          />
        )}

        <Autocomplete
          freeSolo
          size="small"
          options={suggestions}
          inputValue={query}
          onInputChange={(_, value) => setQuery(value)}
          filterOptions={(options, state) =>
            state.inputValue.trim()
              ? suggestionFuse
                  .search(state.inputValue.trim(), { limit: 8 })
                  .map((result) => result.item)
              : options.slice(0, 8)
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search logs"
              placeholder="Message, target, or field"
            />
          )}
          className={styles.searchControl}
        />

        <FormControl size="small" className={styles.levelControl}>
          <InputLabel id="capture-level-label">Capture level</InputLabel>
          <Select
            labelId="capture-level-label"
            label="Capture level"
            value={pendingLevel}
            onChange={(event) =>
              setPendingLevel(event.target.value as RuntimeLogLevel)
            }
            disabled={sourceUnavailable}
          >
            {LOG_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={
            isSavingLevel ? <CircularProgress size={16} /> : <Save size={16} />
          }
          onClick={() => void applyLevel()}
          disabled={
            isSavingLevel || sourceUnavailable || pendingLevel === captureLevel
          }
          className={styles.applyButton}
        >
          Apply
        </Button>
      </Box>

      {sourceUnavailable ? (
        <Box className={styles.emptyState}>
          <Typography color="text.secondary">
            {source === 'edgeagent'
              ? 'Select an EdgeAgent device to inspect and configure its logs.'
              : 'Select an EdgeController to inspect and configure its logs.'}
          </Typography>
        </Box>
      ) : error ? (
        <Box className={styles.emptyState}>
          <Typography color="error.main">{error}</Typography>
        </Box>
      ) : visibleLogs.length === 0 ? (
        <Box className={styles.emptyState}>
          <Typography color="text.secondary">
            {query ? 'No logs match this search.' : 'No logs captured yet.'}
          </Typography>
        </Box>
      ) : (
        <Box
          className={styles.logStream}
          sx={{ borderColor: alpha(theme.palette.divider, 0.8) }}
        >
          {visibleLogs.map((entry) => {
            const hasFields = Object.keys(entry.fields).length > 0;
            const isExpanded = expanded.has(entry.sequence);
            return (
              <Box
                key={`${entry.sequence}-${entry.timestamp}`}
                className={styles.logRow}
                sx={{ borderColor: alpha(theme.palette.divider, 0.65) }}
              >
                <button
                  type="button"
                  className={styles.logSummary}
                  onClick={() => hasFields && toggleExpanded(entry.sequence)}
                  aria-expanded={isExpanded}
                >
                  <Box className={styles.expandIcon}>
                    {hasFields ? (
                      isExpanded ? (
                        <ChevronDown size={15} />
                      ) : (
                        <ChevronRight size={15} />
                      )
                    ) : null}
                  </Box>
                  <Typography
                    component="time"
                    variant="caption"
                    className={styles.timestamp}
                  >
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Chip
                    label={entry.level.toUpperCase()}
                    color={levelColor(entry.level)}
                    size="small"
                    variant="outlined"
                    className={styles.levelChip}
                  />
                  <Typography variant="caption" className={styles.target}>
                    {entry.target}
                  </Typography>
                  <Typography variant="body2" className={styles.message}>
                    {entry.message}
                  </Typography>
                </button>
                <Collapse in={isExpanded} unmountOnExit>
                  <Box component="pre" className={styles.fields}>
                    {JSON.stringify(entry.fields, null, 2)}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Logs;
