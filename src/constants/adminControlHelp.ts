import type {
  ControlAction,
  ControlSource,
  JsonValue,
} from 'types/adminControl';

export interface AdminControlHelp {
  description: string;
  example: string;
  effect: 'Live' | 'Restart required' | 'Action';
}

const FIELD_HELP: Record<
  string,
  Pick<AdminControlHelp, 'description' | 'example'>
> = {
  'tests.test_rail_base_url': {
    description:
      'TestRail instance URL. Leave this empty to disable the TestRail catalog integration.',
    example: 'https://company.testrail.io/',
  },
  'tests.test_rail_api_version': {
    description: 'TestRail API version used for catalog and result requests.',
    example: 'v2',
  },
  'tests.test_rail_username': {
    description: 'TestRail account name used for API authentication.',
    example: 'farm-automation@company.example',
  },
  'tests.test_rail_api_key': {
    description: 'Write-only TestRail API key for the configured account.',
    example: 'A newly generated TestRail API key',
  },
  'tests.test_rail_project_id': {
    description: 'Numeric TestRail project containing the farm test plans.',
    example: '12',
  },
  'tests.test_rail_timeout_seconds': {
    description: 'Maximum duration of one TestRail HTTP request.',
    example: '30 seconds',
  },
  'edgeagent.logLevel': {
    description:
      'Lowest severity retained in the EdgeAgent runtime log buffer.',
    example: 'debug during diagnosis, info normally',
  },
  'edgeagent.heartbeatSeconds': {
    description:
      'Interval between EdgeAgent heartbeats sent to FarmController.',
    example: '5 seconds (accepted range: 1-3600)',
  },
  'edgecontroller.interface': {
    description: 'Linux network interface used to identify the controller.',
    example: 'eth0',
  },
  'edgecontroller.generation': {
    description: 'Hardware generation managed by this EdgeController.',
    example: '4',
  },
  'edgecontroller.raspberryPiModel': {
    description:
      'Raspberry Pi board profile used to translate physical header pins and select the GPIO chip.',
    example: 'Raspberry Pi 4',
  },
  'edgecontroller.relaySerialNumber': {
    description: 'USB relay serial selected for Gen3/Gen4 power control.',
    example: 'A50285BI',
  },
  'edgecontroller.relayVidPid': {
    description: 'USB vendor and product ID used to find the relay.',
    example: '0403:6001',
  },
  'edgecontroller.apiToken': {
    description: 'Write-only bearer token used by FarmController.',
    example: 'A 32-256 character random token',
  },
};

const ACTION_HELP: Record<ControlAction, AdminControlHelp> = {
  restart: {
    description:
      'Terminate the selected service so its supervisor restarts it.',
    example: 'Use after applying restart-required configuration.',
    effect: 'Action',
  },
  discardStaged: {
    description: 'Replace staged FarmController values with the active values.',
    example: 'Discard an incorrect database URL before restarting.',
    effect: 'Action',
  },
  reloadMappings: {
    description: 'Reload EdgeController mapping files from disk.',
    example: 'Use after an authorized manual mapping-file repair.',
    effect: 'Action',
  },
  clearUsbMappings: {
    description: 'Delete all persisted USB relay mappings.',
    example: 'Clear stale Gen3/Gen4 USB mappings before re-verification.',
    effect: 'Action',
  },
  clearGen5Mappings: {
    description: 'Delete persisted Gen5 CPLD mappings.',
    example: 'Clear mappings after replacing a Gen5 controller board.',
    effect: 'Action',
  },
  clearUartMappings: {
    description: 'Delete persisted UART verification mappings.',
    example: 'Clear after changing the physical USB/UART topology.',
    effect: 'Action',
  },
  clearControllerUid: {
    description: 'Remove the EdgeController registration UID.',
    example: 'Use before registering the controller with another farm.',
    effect: 'Action',
  },
  cancelActiveTest: {
    description:
      'Request cancellation of the test currently running on the EdgeAgent.',
    example: 'Stop a test that is blocked waiting for target output.',
    effect: 'Action',
  },
};

const labelFor = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase();

const exampleFor = (name: string, value: JsonValue, secret: boolean) => {
  if (secret) return 'A newly generated secret value';
  if (name.toLowerCase().includes('url')) return 'https://service.example/api';
  if (
    name.toLowerCase().includes('path') ||
    name.toLowerCase().includes('file')
  ) {
    return '/var/lib/service/config.json';
  }
  if (name.toLowerCase().includes('port')) return '8080';
  if (name.toLowerCase().includes('level')) return 'info';
  if (typeof value === 'boolean')
    return value ? 'true (enabled)' : 'false (disabled)';
  if (typeof value === 'number') return String(value || 1);
  if (Array.isArray(value))
    return value.length ? value.join(', ') : 'eth0, usb0';
  if (typeof value === 'string' && value.trim()) return value;
  return `A valid ${labelFor(name)} value`;
};

export const controlHelpFor = (
  source: ControlSource,
  path: string[],
  value: JsonValue,
  secret = false,
): AdminControlHelp => {
  const normalizedPath = path.join('.');
  const key =
    source === 'farmcontroller'
      ? normalizedPath
      : `${source}.${path[path.length - 1]}`;
  const specific = FIELD_HELP[key];
  const name = path[path.length - 1];
  const live =
    source === 'edgeagent' ||
    name === 'logLevel' ||
    (name === 'level' && path.includes('logging'));
  return {
    description:
      specific?.description ??
      (typeof value === 'boolean'
        ? `Enable or disable ${labelFor(name)} for the selected service.`
        : `Configure ${labelFor(name)} for the selected service.`),
    example: specific?.example ?? exampleFor(name, value, secret),
    effect: live ? 'Live' : 'Restart required',
  };
};

export const actionHelpFor = (action: ControlAction) => ACTION_HELP[action];
