export type ControlSource = 'farmcontroller' | 'edgecontroller' | 'edgeagent';
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface ControlContext {
  source: ControlSource;
  controllerId?: string;
  deviceId?: string;
}

export interface FarmControlSnapshot {
  service: 'farmcontroller';
  version: string;
  restartPending: boolean;
  active: JsonObject;
  staged: JsonObject;
  secrets: Record<string, boolean>;
  runtime: {
    logLevel: string;
    databaseConnected: boolean;
    authenticationEnabled: boolean;
    startedAt?: string;
  };
  capabilities: string[];
  constraints: Record<string, JsonValue>;
}

export interface EdgeMappingPaths extends JsonObject {
  uid: string;
  usb: string;
  gen5: string;
  uart: string;
  gen5UartInventory: string;
  gen5PowerInventory: string;
}

export interface EdgeControlSnapshot {
  service: 'edgecontroller';
  version: string;
  restartPending: boolean;
  authentication: {
    enabled: boolean;
    tokenConfigured: boolean;
    defaultEnabled: boolean;
  };
  logging: {
    level: string;
    file: string | null;
    networkDetails: boolean;
    streamDetails: boolean;
  };
  network: {
    bindAddress: string;
    bindPort: number;
    metricsPort: number;
    interface: string;
    farmControllerIp: string;
    farmControllerHttpPort: number;
    farmControllerWebSocketPort: number;
    boardIp?: string;
    boardMac?: string;
  };
  hardware: {
    generation: number;
    relaySerialNumber: string | null;
    relayVidPid: string | null;
  };
  features: {
    active: Record<'gen3' | 'gen4' | 'gen5' | 'rtos', boolean>;
    staged: Record<'gen3' | 'gen4' | 'gen5' | 'rtos', boolean>;
  };
  paths: {
    active: EdgeMappingPaths;
    staged: EdgeMappingPaths;
    config: string;
  };
  mappings: {
    usb: number;
    gen5: number;
    uart: number;
    uidConfigured: boolean;
  };
  capabilities: string[];
  constraints: Record<string, JsonValue>;
}

export interface AgentControlSnapshot {
  service: 'edgeagent';
  version: string;
  restartPending: false;
  configuration: {
    logLevel: string;
    heartbeatSeconds: number;
  };
  runtime: {
    deviceId: string;
    generation: number;
    approved: boolean;
    activeTest: string | null;
    rebooting: boolean;
  };
  capabilities: string[];
  constraints: Record<string, JsonValue>;
}

export type ControlSnapshot =
  | FarmControlSnapshot
  | EdgeControlSnapshot
  | AgentControlSnapshot;

export interface EdgeControlDraft extends JsonObject {
  configPath: string;
  bindAddress: string;
  bindPort: number;
  metricsPort: number;
  interface: string;
  serverIp: string;
  httpPort: number;
  wsPort: number;
  generation: number;
  enableGen3: boolean;
  enableGen4: boolean;
  enableGen5: boolean;
  enableRtos: boolean;
  relaySerialNumber: string;
  relayVidPid: string;
  logLevel: string;
  logFile: string;
  logNetwork: boolean;
  logStream: boolean;
  authEnabled: boolean;
  apiToken: string;
  paths: EdgeMappingPaths;
}

export interface AgentControlDraft extends JsonObject {
  logLevel: string;
  heartbeatSeconds: number;
}

export type ControlAction =
  | 'restart'
  | 'discardStaged'
  | 'reloadMappings'
  | 'clearUsbMappings'
  | 'clearGen5Mappings'
  | 'clearUartMappings'
  | 'clearControllerUid'
  | 'cancelActiveTest';
