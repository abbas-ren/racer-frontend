import type { DeviceState } from 'typesCustom/components';
import type { DevicePower } from 'typesCustom/types';
import { TestStatus } from './tests';

export interface GeneralWebsocketMessage {
  type: 'frontend';
  payload: GeneralWebsocketPayload;
}
export type GeneralWebsocketPayload = 
    HeartbeatPingPayload
  | HeartbeatDataPayload
  | AlertDataPayload
  | UserDataPayload
  | SshOutputPayload
  | DeviceStateUpdatePayload
  | DevicePowerUpdatePayload
  | DeviceControllerChangedPayload
  | TestExecutionPayload
  | TestExecutionStatusUpdatePayload
  | TestExecutionTestcaseUpdatePayload
  | TestExecutionQueuedUpdatePayload
  | TestExecutionCancelRequestedUpdatePayload
  | BuildTestExecutionUpdatePayload
  | BuildPerformanceUpdatePayload
  | BuildStatusChangedPayload
  | BuildUploadedPayload
  | UploadProgressPayload
  | UploadErrorPayload
  | UploadCompletePayload
  | RelayConfigurationStatusPayload
  | RtosLogPayload;


export interface HeartbeatPingPayload {
  kind?: 'heartbeatPing' | null;
  deviceId: string;
  timestamp: string;
  [key: string]: any;
}

export interface HeartbeatDataPayload {
  kind?: 'heartbeat' | null;
  deviceId?: string;
  controllerId?: string;
  deviceControllerId?: string;
  timestamp?: string | number;
  status?: string;
  [key: string]: any;
}

export interface AlertDataPayload {
  kind?: 'alert' | null;
  level?: 'info' | 'warning' | 'critical';
  subtype?: string;
  message: any;
  timestamp?: string;
}

export interface UserDataPayload {
  kind?: 'userData' | null;
  method: string;
  message: any;
  timestamp?: string;
}

export interface SshOutputPayload {
  kind?: 'sshOutput' | null;
  stream: 'stdout' | 'stderr';
  chunk: string;
}


// -------------- Device events ---------------

export interface DeviceStateUpdatePayload {
  kind?: 'deviceStateUpdate' | null;
  deviceId: string;
  state: DeviceState;
  upgrading: boolean;
  flashing: boolean;
  changedAt: string;
}

export interface DevicePowerUpdatePayload {
  kind?: 'devicePowerUpdate' | null;
  deviceId: string;
  power: DevicePower;
  changedAt: string;
}

export interface DeviceControllerChangedPayload {
  kind?: 'deviceControllerChanged' | null;
  action: ChangeAction;
  controllerId: string;
}

// ----------------- Test-execution events -------------

export interface TestExecutionUpdatePayload {
  buildId?: string,
  testId: string;
  status?: TestStatus;
  progress?: number;
  message?: string;
  cancelRequested?: boolean;
}

export interface TestExecutionPayload {
  kind?: 'testExecution' | null;
  testId: string;
  type: TestExecutionType;
  data: TestExecutionData;
}
export interface TestExecutionStatusUpdatePayload {
  kind?: 'testExecutionStatusUpdate' | null;
  data: {
    status: string;
    timestamp?: string;
    progress?: number;
    message?: string;
  };
}

export interface TestExecutionTestcaseUpdatePayload {
  kind?: 'testExecutionTestcaseUpdate' | null;
  data: {
    testCaseId: string | number;
    result?: string;
  };
}

export interface TestExecutionQueuedUpdatePayload {
  kind?: 'testExecutionQueuedUpdate' | null;
  data: {
    status: 'not_executed';
    timestamp: string;
  };
}

export interface TestExecutionCancelRequestedUpdatePayload {
  kind?: 'testExecutionCancelRequestedUpdate' | null;
  data: {
    cancelRequested: true;
    phase: string;
    timestamp: string;
  };
}

// For the build-scoped summary/update form
export interface BuildTestExecutionUpdatePayload {
  kind?: 'buildTestExecutionUpdate' | null;
  testId: string;
  buildId: string;
  status?: string;
  testCaseId?: string;
}

// ----------------- Build-related events ---------------

export interface BuildPerformanceUpdatePayload {
  kind?: 'buildPerformanceUpdate' | null;
  buildId: string;
}

export interface BuildStatusChangedPayload {
  kind?: 'buildStatusChanged' | null;
  releaseId: string;
  status: string;
  isFaulty: boolean;
  deviceId?: string | null;
  deviceType: string;
  version?: string | null;
  userId: string;
}

export interface BuildUploadedPayload {
  kind?: 'buildUploaded' | null;
  releaseId: string;
  version: string;
  deviceType: string;
  deviceFamily: string;
  buildType: string;
}

export interface BuildDeletedPayload {
  kind?: 'buildDeleted' | null;
  releaseId: string;
  version: string;
  deviceType: string;
  userId: string;
}

export interface BuildFlaggedPayload {
  kind?: 'buildFlagged' | null;
  releaseId: string;
  isFaulty: boolean;
  version: string;
  deviceType: string;
  userId: string;
}

// ----------------- Upload-related events ---------------

export interface UploadProgressPayload {
  kind?: 'uploadProgress' | null;
  uploadId: string;
  percent: number;
}

export interface UploadErrorPayload {
  kind?: 'uploadError' | null;
  uploadId: string;
  message: string;
}

export interface UploadCompletePayload {
  kind?: 'uploadComplete' | null;
  uploadId: string;
  fileName: string;
  tag?: string;
}

// ----------------- Relay-related events ---------------


export interface RelayConfigurationStatusPayload {
  kind?: 'relayConfigurationStatus' | null;
  relayId?: string | null;
  controllerId?: string | null;
  status: RelayConfigurationStatus;
  total: number;
  completed: number;
  errors?: string[];
  message?: string | null;
}

// ----------------- RTOS log events ---------------
export interface RtosLogPayload {
  kind?: 'rtosLog' | null;
  testId: string;
  buildId?: string;
  path: string;
  userId: string;
}

export interface InterfaceUpdatePayload {
  kind?: 'interfaceUpdate' | null;
  deviceId: string;
  changes: Array<{
    type: string;
    interfaceId: string | null;
    status: string;
  }>;
  heartbeatData: any;
  timestamp: string;
}

export interface DevicePingPayload {
  kind?: 'devicePing' | null;
  deviceId: string;
  timestamp: string;
}

export interface DeviceControllerPingPayload {
  kind?: 'deviceControllerPing' | null;
  controllerId: string;
  timestamp: string;
  metrics?: any;
}

// ----------------- Enums and helper interfaces ---------------

export interface TestExecutionData {
  status?: TestStatus;
  message?: string;
  timestamp: string;
  cancelRequested?: boolean;
  phase?: string;
  rtosLogPath?: string;
}

export enum RelayConfigurationStatus {
  InProgress = 'inProgress',
  Completed = 'completed',
  CompletedWithErrors = 'completedWithErrors',
  Failed = 'failed',
}

export enum TestExecutionType {
    Status = 'status',
    Log = 'log',
    New = 'new',
    CancelRequested = 'cancelRequested',
    RtosLog = 'rtosLog',
    Queued = 'queued',
}
export interface GenericWsMessage {
  type?: string;
  data?: unknown;
  [key: string]: unknown;
}

export enum ChangeAction {
  Added = 'added',
  Updated = 'updated',
  Deleted = 'deleted',
}