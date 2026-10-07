export type DeviceControllerStatus = 'approved' | 'requested';
export type DeviceControllerState = 'active' | 'not-reachable';
export type VoltageLevel = 'HIGH' | 'LOW';

export interface DeviceControllerRelay {
  id: string;
  serialNumber: string;
  deviceControllerId?: string;
  vendorId?: string;
  productId?: string;
  createdAt?: string;
  updatedAt?: string;
  state?: 'connected' | 'disconnected';
  relayChannels?: RelayChannelItem[];
}

export interface RelayChannelDevice {
  deviceId: string;
  macAddress: string;
  deviceName: string;
  deviceType?: string;
  ipAddress: string;
}

export interface RelayChannelItem {
  id: string;
  relayId: string;
  channelNumber: number;
  deviceId?: string | null;
  state?: 'on' | 'off';
  device?: RelayChannelDevice | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceControllerItem {
  deviceControllerId: string;
  macAddress: string;
  ipAddress: string;
  name?: string;
  deviceFamily?: string;
  status?: DeviceControllerStatus;
  state?: DeviceControllerState;
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
  relays?: DeviceControllerRelay[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceControllerListQuery {
  search?: string;
  status?: string;
  state?: string;
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'name'
    | 'deviceFamily'
    | 'macAddress'
    | 'ipAddress'
    | 'status'
    | 'state';
  desc?: 'true' | 'false';
  page?: number | string;
  limit?: number | string;
}

export interface DeviceControllerListResponse {
  data: DeviceControllerItem[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  summary: {
    controllers: {
      total: number;
      active: number;
      notReachable: number;
    };
    relays: {
      total: number;
      connected: number;
      disconnected: number;
    };
  };
}

export interface UpdateDeviceControllerPayload {
  name?: string;
  deviceFamily?: string;
  ipAddress?: string;
}

export interface UpdateDeviceControllerResponse {
  success: boolean;
  data: DeviceControllerItem;
}

export interface AvailableRelayDevice {
  deviceId: string;
  macAddress: string;
  deviceName: string;
  ipAddress: string;
  deviceType: string;
  deviceFamily?: string;
}

export interface AvailableRelayDevicesResponse {
  devices: AvailableRelayDevice[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface RelayDevicesQuery {
  page?: number;
  limit?: number;
  relayId?: string;
}

export interface ConfigureRelayChannelPayload {
  relayId: string;
  channelId: string;
  deviceId?: string;
  gpio?: string;
  gpioDefaultLevel: VoltageLevel;
  relayDefaultLevel: VoltageLevel;
}

export interface ConfigureRelayChannelResponse {
  message: string;
  data: RelayChannelItem | RelayChannelItem[];
}

export interface RelayIdentityUpdatePayload {
  serialNumber?: string;
  vidPid: string;
}

export interface RelayIdentityUpdateResponse {
  message: string;
  relayId: string;
  serialNumber: string;
  vidPid: string;
}
