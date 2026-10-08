import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Database,
  FileCog,
  RefreshCw,
  RotateCcw,
  Save,
  ServerCog,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAdminControl,
  runAdminControlAction,
  updateAdminControl,
} from 'services/adminControlApiService';
import { fetchAllDeviceControllers } from 'services/deviceControllerAPIService';
import toastService from 'services/ToastService';
import type {
  ControlAction,
  ControlContext,
  ControlSnapshot,
  ControlSource,
  EdgeControlDraft,
  EdgeControlSnapshot,
  JsonObject,
  JsonValue,
} from 'types/adminControl';
import type { DeviceControllerItem } from 'types/deviceController';
import styles from './ControlCenter.module.scss';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'off'];

const labelFor = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());

const clone = <Value,>(value: Value): Value => structuredClone(value);

const setValueAtPath = (
  source: JsonObject,
  path: string[],
  value: JsonValue,
): JsonObject => {
  const next = clone(source);
  let target = next;
  path.slice(0, -1).forEach((part) => {
    target = target[part] as JsonObject;
  });
  target[path[path.length - 1]] = value;
  return next;
};

const omitNulls = (value: JsonValue): JsonValue | undefined => {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    return value
      .map(omitNulls)
      .filter((item): item is JsonValue => item !== undefined);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, omitNulls(item)] as const)
        .filter(
          (entry): entry is [string, JsonValue] => entry[1] !== undefined,
        ),
    );
  }
  return value;
};

const omitBlankSecrets = (
  payload: JsonObject,
  secrets: Record<string, boolean>,
) => {
  Object.keys(secrets).forEach((secretPath) => {
    const parts = secretPath.split('.');
    let target: JsonObject | undefined = payload;
    parts.slice(0, -1).forEach((part) => {
      const next = target?.[part];
      target =
        next && !Array.isArray(next) && typeof next === 'object'
          ? next
          : undefined;
    });
    const name = parts[parts.length - 1];
    if (target?.[name] === '') delete target[name];
  });
};

const edgeDraftFrom = (snapshot: EdgeControlSnapshot): EdgeControlDraft => ({
  configPath: snapshot.paths.config,
  bindAddress: snapshot.network.bindAddress,
  bindPort: snapshot.network.bindPort,
  metricsPort: snapshot.network.metricsPort,
  interface: snapshot.network.interface,
  serverIp: snapshot.network.farmControllerIp,
  httpPort: snapshot.network.farmControllerHttpPort,
  wsPort: snapshot.network.farmControllerWebSocketPort,
  generation: snapshot.hardware.generation,
  enableGen3: snapshot.features.staged.gen3,
  enableGen4: snapshot.features.staged.gen4,
  enableGen5: snapshot.features.staged.gen5,
  enableRtos: snapshot.features.staged.rtos,
  relaySerialNumber: snapshot.hardware.relaySerialNumber ?? '',
  relayVidPid: snapshot.hardware.relayVidPid ?? '',
  logLevel: snapshot.logging.level,
  logFile: snapshot.logging.file ?? '',
  logNetwork: snapshot.logging.networkDetails,
  logStream: snapshot.logging.streamDetails,
  authEnabled: snapshot.authentication.enabled,
  apiToken: '',
  paths: clone(snapshot.paths.staged),
});

const EDGE_SECTIONS: Record<string, string[]> = {
  service: ['configPath'],
  network: [
    'bindAddress',
    'bindPort',
    'metricsPort',
    'interface',
    'serverIp',
    'httpPort',
    'wsPort',
  ],
  features: ['enableGen3', 'enableGen4', 'enableGen5', 'enableRtos'],
  hardware: ['generation', 'relaySerialNumber', 'relayVidPid'],
  logging: ['logLevel', 'logFile', 'logNetwork', 'logStream'],
  authentication: ['authEnabled', 'apiToken'],
  paths: ['paths'],
};

interface ControlFieldProps {
  name: string;
  path: string[];
  value: JsonValue;
  activeValue?: JsonValue;
  configuredSecret?: boolean;
  onChange: (path: string[], value: JsonValue) => void;
}

const ControlField = ({
  name,
  path,
  value,
  activeValue,
  configuredSecret,
  onChange,
}: ControlFieldProps) => {
  if (value !== null && !Array.isArray(value) && typeof value === 'object') {
    return (
      <Box className={styles.fieldGroup}>
        <Typography variant="subtitle2">{labelFor(name)}</Typography>
        <Box className={styles.fieldGrid}>
          {Object.entries(value)
            .filter(([, childValue]) => childValue !== null)
            .map(([childName, childValue]) => (
              <ControlField
                key={childName}
                name={childName}
                path={[...path, childName]}
                value={childValue}
                activeValue={
                  activeValue &&
                  !Array.isArray(activeValue) &&
                  typeof activeValue === 'object'
                    ? activeValue[childName]
                    : undefined
                }
                onChange={onChange}
              />
            ))}
        </Box>
      </Box>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <Box className={styles.switchField}>
        <FormControlLabel
          control={
            <Switch
              checked={value}
              onChange={(event) => onChange(path, event.target.checked)}
            />
          }
          label={labelFor(name)}
        />
        {activeValue !== undefined && activeValue !== value && (
          <Typography variant="caption" color="warning.main">
            Active: {String(activeValue)}
          </Typography>
        )}
      </Box>
    );
  }

  const isSecret = configuredSecret !== undefined || name === 'apiToken';
  const isLogLevel =
    name === 'logLevel' || (name === 'level' && path.includes('logging'));
  if (isLogLevel) {
    return (
      <TextField
        select
        size="small"
        label={labelFor(name)}
        value={String(value ?? '')}
        onChange={(event) => onChange(path, event.target.value)}
        helperText="Applied live"
      >
        {LOG_LEVELS.map((level) => (
          <MenuItem key={level} value={level}>
            {labelFor(level)}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  const displayValue = Array.isArray(value) ? value.join(', ') : (value ?? '');
  const changed =
    activeValue !== undefined &&
    JSON.stringify(activeValue) !== JSON.stringify(value);
  return (
    <TextField
      size="small"
      type={
        isSecret ? 'password' : typeof value === 'number' ? 'number' : 'text'
      }
      label={labelFor(name)}
      value={displayValue}
      autoComplete={isSecret ? 'new-password' : undefined}
      placeholder={
        isSecret && configuredSecret
          ? 'Configured; enter to replace'
          : undefined
      }
      onChange={(event) => {
        if (Array.isArray(value)) {
          onChange(
            path,
            event.target.value
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean),
          );
        } else if (typeof value === 'number') {
          onChange(path, Number(event.target.value));
        } else {
          onChange(path, event.target.value);
        }
      }}
      helperText={
        isSecret
          ? configuredSecret
            ? 'Write-only; a value is configured'
            : 'Write-only'
          : changed
            ? `Active: ${Array.isArray(activeValue) ? activeValue.join(', ') : String(activeValue)}`
            : Array.isArray(value)
              ? 'Comma-separated values'
              : ' '
      }
      FormHelperTextProps={{
        className: changed ? styles.changedHint : undefined,
      }}
    />
  );
};

const ControlCenter = () => {
  const [source, setSource] = useState<ControlSource>('farmcontroller');
  const [controllers, setControllers] = useState<DeviceControllerItem[]>([]);
  const [controller, setController] = useState<DeviceControllerItem | null>(
    null,
  );
  const [snapshot, setSnapshot] = useState<ControlSnapshot | null>(null);
  const [draft, setDraft] = useState<JsonObject | null>(null);
  const [section, setSection] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchAllDeviceControllers({ page: 1, limit: 100 })
      .then((response) => setControllers(response.data ?? []))
      .catch(() => toastService.error('Failed to load EdgeControllers'));
  }, []);

  const context = useMemo<ControlContext>(
    () => ({
      source,
      controllerId:
        source === 'edgecontroller'
          ? controller?.deviceControllerId
          : undefined,
    }),
    [controller?.deviceControllerId, source],
  );

  const load = useCallback(async () => {
    if (source === 'edgecontroller' && !controller) {
      setSnapshot(null);
      setDraft(null);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchAdminControl(context);
      setSnapshot(response);
      const nextDraft =
        response.service === 'farmcontroller'
          ? clone(response.staged)
          : edgeDraftFrom(response);
      setDraft(nextDraft);
      setSection(
        response.service === 'farmcontroller'
          ? (Object.keys(nextDraft)[0] ?? '')
          : Object.keys(EDGE_SECTIONS)[0],
      );
    } catch (error) {
      toastService.error(
        error instanceof Error ? error.message : 'Failed to load controls',
      );
      setSnapshot(null);
      setDraft(null);
    } finally {
      setIsLoading(false);
    }
  }, [context, controller, source]);

  useEffect(() => {
    void load();
  }, [load]);

  const sections = useMemo(
    () =>
      snapshot?.service === 'farmcontroller' && draft
        ? Object.keys(draft)
        : Object.keys(EDGE_SECTIONS),
    [draft, snapshot?.service],
  );

  const updateDraft = (path: string[], value: JsonValue) => {
    setDraft((current) =>
      current ? setValueAtPath(current, path, value) : current,
    );
  };

  const save = async () => {
    if (!draft || !snapshot) return;
    setIsSaving(true);
    try {
      let payload = omitNulls(draft) as JsonObject;
      if (snapshot.service === 'farmcontroller') {
        omitBlankSecrets(payload, snapshot.secrets);
      } else {
        const edgePayload = clone(payload);
        if (!edgePayload.apiToken) delete edgePayload.apiToken;
        edgePayload.relaySerialNumber ||= null;
        edgePayload.relayVidPid ||= null;
        edgePayload.logFile ||= null;
        payload = edgePayload;
      }
      const response = await updateAdminControl(context, payload);
      setSnapshot(response);
      setDraft(
        response.service === 'farmcontroller'
          ? clone(response.staged)
          : edgeDraftFrom(response),
      );
      toastService.success(
        response.restartPending
          ? 'Configuration staged; restart required'
          : 'Configuration applied',
      );
    } catch (error) {
      toastService.error(
        error instanceof Error ? error.message : 'Configuration update failed',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (action: ControlAction, destructive = false) => {
    if (
      destructive &&
      !window.confirm(
        action === 'restart'
          ? `Restart ${source === 'farmcontroller' ? 'FarmController' : 'EdgeController'} now?`
          : 'This permanently removes the selected mapping data. Continue?',
      )
    ) {
      return;
    }
    try {
      await runAdminControlAction(context, action);
      toastService.success(
        action === 'restart' ? 'Restart accepted' : 'Action completed',
      );
      if (action !== 'restart') await load();
    } catch (error) {
      toastService.error(
        error instanceof Error ? error.message : 'Control action failed',
      );
    }
  };

  const activeSection =
    snapshot?.service === 'farmcontroller'
      ? (snapshot.active[section] as JsonValue | undefined)
      : undefined;
  const sectionValue = draft?.[section];
  const visibleSectionValue =
    snapshot?.service === 'farmcontroller' &&
    sectionValue &&
    !Array.isArray(sectionValue) &&
    typeof sectionValue === 'object'
      ? Object.fromEntries(
          Object.entries(sectionValue).filter(
            ([name]) => !(snapshot.secrets[`${section}.${name}`] !== undefined),
          ),
        )
      : sectionValue;
  const edgeSectionFields = EDGE_SECTIONS[section] ?? [];

  return (
    <Box className={styles.pageRoot}>
      <Box className={styles.headingRow}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ServerCog size={22} />
            <Typography variant="h5" component="h1" fontWeight={700}>
              Controller control center
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Runtime and staged service configuration
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {snapshot?.restartPending && (
            <Chip label="Restart required" color="warning" size="small" />
          )}
          <Tooltip title="Reload configuration">
            <span>
              <Button
                aria-label="Reload configuration"
                variant="outlined"
                onClick={() => void load()}
                disabled={isLoading}
                className={styles.iconButton}
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

      <Box className={styles.contextBand}>
        <FormControl size="small">
          <InputLabel id="control-source-label">Service</InputLabel>
          <Select
            labelId="control-source-label"
            label="Service"
            value={source}
            onChange={(event) => {
              setSource(event.target.value as ControlSource);
              setSnapshot(null);
              setDraft(null);
            }}
          >
            <MenuItem value="farmcontroller">FarmController</MenuItem>
            <MenuItem value="edgecontroller">EdgeController</MenuItem>
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
            renderInput={(params) => (
              <TextField {...params} label="EdgeController" />
            )}
          />
        )}
        {snapshot && (
          <Stack direction="row" spacing={1} className={styles.statusStrip}>
            <Chip
              label={`v${snapshot.version}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={
                snapshot.restartPending
                  ? 'Staged changes'
                  : 'Active matches staged'
              }
              color={snapshot.restartPending ? 'warning' : 'success'}
              size="small"
              variant="outlined"
            />
          </Stack>
        )}
      </Box>

      {isLoading && !snapshot ? (
        <Box className={styles.emptyState}>
          <CircularProgress size={26} />
        </Box>
      ) : !snapshot || !draft ? (
        <Box className={styles.emptyState}>
          <Typography color="text.secondary">
            {source === 'edgecontroller'
              ? 'Select an EdgeController to manage.'
              : 'Configuration is unavailable.'}
          </Typography>
        </Box>
      ) : (
        <>
          <Tabs
            value={sections.includes(section) ? section : sections[0]}
            onChange={(_, value: string) => setSection(value)}
            variant="scrollable"
            scrollButtons="auto"
            className={styles.sectionTabs}
          >
            {sections.map((item) => (
              <Tab key={item} value={item} label={labelFor(item)} />
            ))}
          </Tabs>

          <Box className={styles.editorBand}>
            <Box className={styles.sectionHeading}>
              <Box>
                <Typography variant="h6">{labelFor(section)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Live-safe values apply immediately; other values are staged
                  for restart.
                </Typography>
              </Box>
              {section === 'authentication' || section === 'auth' ? (
                <ShieldCheck size={22} />
              ) : section === 'database' ? (
                <Database size={22} />
              ) : (
                <FileCog size={22} />
              )}
            </Box>
            <Box className={styles.fieldGrid}>
              {snapshot.service === 'farmcontroller' &&
              visibleSectionValue !== undefined ? (
                <ControlField
                  name={section}
                  path={[section]}
                  value={visibleSectionValue}
                  activeValue={activeSection}
                  onChange={updateDraft}
                />
              ) : (
                edgeSectionFields.map((name) => (
                  <ControlField
                    key={name}
                    name={name}
                    path={[name]}
                    value={draft[name]}
                    configuredSecret={
                      name === 'apiToken'
                        ? (snapshot as EdgeControlSnapshot).authentication
                            .tokenConfigured
                        : undefined
                    }
                    onChange={updateDraft}
                  />
                ))
              )}
            </Box>
            {snapshot.service === 'farmcontroller' &&
              Object.entries(snapshot.secrets)
                .filter(([path]) => path.startsWith(`${section}.`))
                .map(([path, configured]) => {
                  const parts = path.split('.');
                  const name = parts[parts.length - 1];
                  return (
                    <Box className={styles.secretField} key={path}>
                      <ControlField
                        name={name}
                        path={path.split('.')}
                        value={
                          draft[section] && typeof draft[section] === 'object'
                            ? ((draft[section] as JsonObject)[name] ?? '')
                            : ''
                        }
                        configuredSecret={configured}
                        onChange={updateDraft}
                      />
                    </Box>
                  );
                })}
          </Box>

          <Box className={styles.actionBar}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="contained"
                startIcon={
                  isSaving ? <CircularProgress size={16} /> : <Save size={17} />
                }
                disabled={isSaving}
                onClick={() => void save()}
              >
                Save configuration
              </Button>
              {snapshot.service === 'farmcontroller' &&
                snapshot.restartPending && (
                  <Button
                    variant="outlined"
                    startIcon={<RotateCcw size={17} />}
                    onClick={() => void runAction('discardStaged')}
                  >
                    Discard staged
                  </Button>
                )}
            </Stack>
            <Button
              color="warning"
              variant="outlined"
              startIcon={<RefreshCw size={17} />}
              onClick={() => void runAction('restart', true)}
            >
              Restart service
            </Button>
          </Box>

          {snapshot.service === 'edgecontroller' && (
            <Box className={styles.maintenanceBand}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Mapping maintenance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  USB {snapshot.mappings.usb} · Gen5 {snapshot.mappings.gen5} ·
                  UART {snapshot.mappings.uart}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  onClick={() => void runAction('reloadMappings')}
                >
                  Reload mappings
                </Button>
                {(
                  [
                    'clearUsbMappings',
                    'clearGen5Mappings',
                    'clearUartMappings',
                    'clearControllerUid',
                  ] as ControlAction[]
                ).map((action) => (
                  <Button
                    key={action}
                    color="error"
                    variant="text"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => void runAction(action, true)}
                  >
                    {labelFor(action)}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ControlCenter;
