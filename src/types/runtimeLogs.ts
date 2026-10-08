export type RuntimeLogSource =
  | 'farmcontroller'
  | 'edgecontroller'
  | 'edgeagent';
export type RuntimeLogLevel =
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'off';

export interface RuntimeLogEntry {
  sequence: number;
  timestamp: string;
  level: Exclude<RuntimeLogLevel, 'off'>;
  target: string;
  message: string;
  fields: Record<string, unknown>;
}

export interface RuntimeLogsResponse {
  source?: RuntimeLogSource;
  level: string;
  logs: RuntimeLogEntry[];
}

export interface RuntimeLogRequestContext {
  source: RuntimeLogSource;
  controllerId?: string;
  deviceId?: string;
}
