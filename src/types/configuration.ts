export type ControllerStatus = 'Online' | 'Offline';
export type VoltageLevel = 'HIGH' | 'LOW';

export interface ChannelHardwareAssignment {
  gpio: string;
  gpioDefaultLevel: VoltageLevel;
  relayDefaultLevel: VoltageLevel;
}

export interface RelayChannelMapping {
  channelId: string;
  channelNumber: number;
  deviceId?: string;
  gpio?: string;
  gpioDefaultLevel?: VoltageLevel;
  relayDefaultLevel?: VoltageLevel;
}

export interface RelayRow {
  relayId: string;
  serialNo: string;
  vidPid?: string;
  channels: number;
  status: ControllerStatus;
  relayChannels: RelayChannelMapping[];
  channelAssignments?: Record<number, string>;
}

export interface ControllerRow {
  controllerId: string;
  controllerName: string;
  generation: string;
  ipAddress: string;
  relaysOnline: number;
  relaysTotal: number;
  status: ControllerStatus;
  relays: RelayRow[];
  mappings?: Record<
    string,
    {
      uart?: string;
      power?: string;
      port?: string;
      gpio?: string;
      gpioDefaultLevel?: VoltageLevel;
      relayDefaultLevel?: VoltageLevel;
    }
  >;
}

export interface EditControllerForm {
  controllerId: string;
  controllerName: string;
  ipAddress: string;
  generation: string;
}

export interface SelectedRelayContext {
  controllerId: string;
  relay: RelayRow;
}

export interface StatusStyles {
  color: string;
  bg: string;
  border: string;
}

export interface ConfigurationStat {
  label: string;
  value: number;
  iconName: 'server' | 'wifi' | 'zap' | 'activity';
  iconBg: string;
}

export interface ConfigurationSummary {
  controllers: {
    total: number;
    online: number;
    offline: number;
  };
  relays: {
    total: number;
    online: number;
    offline: number;
  };
}

export interface RelayDeviceOption {
  deviceId: string;
  deviceType: string;
  macAddress: string;
}
