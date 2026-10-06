export enum DeviceState {
  AVAILABLE = 'free',
  BUSY = 'busy',
  FAULTY = 'faulty',
  NOT_REACHABLE = 'not_reachable',
  UNKNOWN = 'unknown',
}

export enum DeviceStatus {
  APPROVED = 'approved',
  REQUESTED = 'requested',
  DECLINED = 'declined',
}

export enum DeviceInterfaceStatus {
  UP = 'up',
  DOWN = 'down',
  PLUGGED = 'plugged',
  UN_PLUGGED = 'unplugged',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  UNKNOWN = 'unknown',
}

export interface DeviceStateCardProps {
  type: DeviceState;
  data: {
    total: number;
    current: number;
  };
}
