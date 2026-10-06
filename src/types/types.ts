import { ButtonProps, SxProps, Theme } from '@mui/material';
import { DeviceState, DeviceStatus } from './components';
import { TestStatus } from './tests';

export enum ButtonPreset {
  Primary = 'primary',
  Secondary = 'secondary',
  Error = 'error',
  Warning = 'warning',
  Disabled = 'disabled',
}

export interface CustomButtonProps extends ButtonProps {
  preset?: ButtonPreset;
  buttonStyle?: SxProps<Theme>;
  disabled?: boolean;
  outlined?: boolean;
}
export interface IUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  createdTimestamp: number;
  enabled: boolean;
  totp: boolean;
  disableableCredentialTypes: any[];
  requiredActions: string[];
  notBefore: number;
  access: Access;
  realmRoles: string[];
  _role?: string;
}

export interface Access {
  manageGroupMembership: boolean;
  view: boolean;
  mapRoles: boolean;
  impersonate: boolean;
  manage: boolean;
}

// export interface RealmRole {
//   id: string;
//   name: string;
//   description: string;
//   composite: boolean;
//   clientRole: boolean;
//   containerId: string;
// }

export type DevicePower = 'on' | 'off';

export interface IDevice {
  id: number;
  deviceName: string;
  deviceFamily?: string;
  deviceId: string;
  macAddress: string;
  ipAddress: string;
  deviceType: string;
  state: DeviceState;
  status: DeviceStatus;
  lastConnectedOn: string;
  controllerId: any;
  createdBy: any;
  updatedBy: any;
  statusActionBy: any;
  createdAt: string;
  updatedAt: string;
  interfaces: Interface[];
  testResult?: string;
  stateUpdatedAt: string;
  timeout?: number;
  heartbeatTimer: number;
  testExecutions?: TestExecution[];
  usage?: {
    totalDevices: number;
    totalHours: number;
    states: {
      [k: string]: number;
    };
  };
  lastTestExecution?: string;
  lastExecutionStatus?: TestStatus;
  softwareVersion?: string;
  terminal?: string;
  upgrading?: boolean;
  flashing?: boolean;
  power?: DevicePower;
}

export interface Interface {
  id: number;
  interfaceId: string;
  deviceId: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceStateChange {
  deviceId: string;
  state: DeviceState;
  changedAt: string;
  upgrading?: boolean;
  flashing?: boolean;
}

export interface DevicePowerChange {
  deviceId: string;
  power: DevicePower;
  changedAt: string;
}

export interface DeviceDetail {
  id: number;
  deviceName: string;
  deviceFamily: string;
  deviceId: string;
  macAddress: string;
  ipAddress: string;
  deviceType: string;
  buildId: string;
  softwareVersion?: string;
  state: string;
  status: string;
  lastConnectedOn: string;
  stateUpdatedAt: string;
  controllerId: string;
  createdBy: string;
  updatedBy: string;
  statusActionBy: string;
  heartbeatTimer: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  interfaces: Interfaces[];
  testExecutions: TestExecution[];
}

export interface Interfaces {
  id: number;
  interfaceId: string;
  deviceId: string;
  name: any;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestExecution {
  id: number;
  testId: string;
  deviceFamily: string;
  deviceId: string;
  buildId: string;
  testPlanId: string;
  testSuits: TestSuite[];
  testCases: TestCase[];
  logs: string[];
  testCycleId: string;
  status: string;
  createdBy: string;
  updatedBy: string;
  startedAt: string;
  endedAt: string;
  testPlanName: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestSuite {
  id: number;
  name: string;
}

export interface TestCase {
  id: string;
  name: string;
  suiteId: number;
  result?: 'PASS' | 'FAIL';
  suiteName: string;
  updatedAt: string;
  versionNo: number;
  executionId: number;
}
