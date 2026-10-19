import type { DeviceState } from 'typesCustom/components';
import type { DevicePower } from 'typesCustom/types';

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
  | TestExecutionUpdatePayload
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
  kind: 'heartbeatPing';
  deviceId: string;
  timestamp: string;
  [key: string]: any;
}

export interface HeartbeatDataPayload {
  kind: 'heartbeat';
  deviceId?: string;
  controllerId?: string;
  deviceControllerId?: string;
  timestamp?: string | number;
  status?: string;
  [key: string]: any;
}

export interface AlertDataPayload {
  kind: 'alert';
  level?: 'info' | 'warning' | 'critical';
  subtype?: string;
  message: any;
  timestamp?: string;
}

export interface UserDataPayload {
  kind: 'userData';
  method: string;
  message: any;
  timestamp?: string;
}

export interface SshOutputPayload {
  kind: 'sshOutput';
  stream: 'stdout' | 'stderr';
  chunk: string;
}

export interface GenericWsMessage {
  type?: string;
  data?: unknown;
  [key: string]: unknown;
}


// -------------- Device events ---------------

export interface DeviceStateUpdatePayload {
  kind: 'deviceStateUpdate';
  deviceId: string;
  state: DeviceState;
  upgrading: boolean;
  flashing: boolean;
  changedAt: string;
}

export interface DevicePowerUpdatePayload {
  kind: 'devicePowerUpdate';
  deviceId: string;
  power: DevicePower;
  changedAt: string;
}

export interface DeviceControllerChangedPayload {
  kind: 'deviceControllerChanged';
  action: 'updated';
  controllerId: string;
}

// ----------------- Test-execution events -------------

export type TestExecutionUpdatePayload =
  | TestExecutionStatusUpdate
  | TestExecutionTestcaseUpdate
  | TestExecutionQueuedUpdate
  | TestExecutionCancelRequestedUpdate;

export interface TestExecutionStatusUpdate {
  kind: 'testExecutionStatusUpdate';
  data: {
    status: string;
    timestamp?: string;
    progress?: number;
    message?: string;
  };
}

export interface TestExecutionTestcaseUpdate {
  kind: 'testExecutionTestcaseUpdate';
  data: {
    testCaseId: string | number;
    result?: string;
  };
}

export interface TestExecutionQueuedUpdate {
  kind: 'testExecutionQueuedUpdate';
  data: {
    status: 'not_executed';
    timestamp: string;
  };
}

export interface TestExecutionCancelRequestedUpdate {
  kind: 'testExecutionCancelRequestedUpdate';
  data: {
    cancelRequested: true;
    phase: string;
    timestamp: string;
  };
}

export interface TestExecutionPayload {
  kind: 'testExecution';
  testId: string;
  buildId?: string;
  createdBy?: string;
  update: TestExecutionUpdatePayload;
}

// For the build-scoped summary/update form
export interface BuildTestExecutionUpdatePayload {
  kind: 'buildTestExecutionUpdate';
  testId: string;
  buildId: string;
  status?: string;
  cancelRequested?: boolean;
  testCaseId?: string;
}

// ----------------- Build-related events ---------------

export interface BuildPerformanceUpdatePayload {
  kind: 'buildPerformanceUpdate';
  buildId: string;
}

export interface BuildStatusChangedPayload {
  kind: 'buildStatusChanged';
  releaseId: string;
  status: string;
  isFaulty: boolean;
  deviceId?: string | null;
  deviceType: string;
  version?: string | null;
  userId: string;
}

export interface BuildUploadedPayload {
  kind: 'buildUploaded';
  releaseId: string;
  version: string;
  deviceType: string;
  deviceFamily: string;
  buildType: string;
}

export interface BuildDeletedPayload {
  kind: 'buildDeleted';
  releaseId: string;
  version: string;
  deviceType: string;
  userId: string;
}

// ----------------- Upload-related events ---------------

export interface UploadProgressPayload {
  kind: 'uploadProgress';
  uploadId: string;
  percent: number;
}

export interface UploadErrorPayload {
  kind: 'uploadError';
  uploadId: string;
  message: string;
}

export interface UploadCompletePayload {
  kind: 'uploadComplete';
  uploadId: string;
  fileName: string;
  tag?: string;
}

// ----------------- Relay-related events ---------------
export interface RelayConfigurationStatusPayload {
  kind: 'relayConfigurationStatus';
  relayId?: string | null;
  controllerId?: string | null;
  status: string;
  total: number;
  completed: number;
  errors?: string[];
  message?: string | null;
}

// ----------------- RTOS log events ---------------
export interface RtosLogPayload {
  kind: 'rtosLog';
  testId: string;
  buildId?: string;
  path: string;
  userId: string;
}

export interface InterfaceUpdatePayload {
  kind: 'interfaceUpdate';
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
  kind: 'devicePing';
  deviceId: string;
  timestamp: string;
}

export interface DeviceControllerPingPayload {
  kind: 'deviceControllerPing';
  controllerId: string;
  timestamp: string;
  metrics?: any;
}