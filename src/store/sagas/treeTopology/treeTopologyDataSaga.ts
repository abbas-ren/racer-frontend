import { all, call, put, takeLatest } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';
import { fetchControllers } from 'services/configurationApiService';
import {
  fetchDevicesForTopologyApi,
  fetchDeviceDetailApi,
  fetchLastHeartbeatApi,
  TopologyDevice,
} from 'services/deviceApiService';
import type { ControllerRow } from 'types/configuration';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  fetchTreeTopologyDataFailure,
  fetchTreeTopologyDataRequest,
  fetchTreeTopologyDataSuccess,
  fetchSidebarDeviceRequest,
  fetchSidebarDeviceSuccess,
  fetchSidebarDeviceFailure,
} from 'store/slices/treeTopology/treeTopologyDataSlice';
import { seedHeartbeatFromBackend } from 'store/slices/deviceHeartbeat/deviceHeartbeatSlice';
import type { IDevice } from 'types/types';

function* handleFetchTreeTopologyData(): SagaIterator {
  try {
    const [controllersResult, topologyResult]: [
      { rows: ControllerRow[] },
      { success: boolean; data: TopologyDevice[] },
    ] = yield all([
      call(fetchControllers, {
        page: 1,
        limit: 200,
      }),
      call(fetchDevicesForTopologyApi),
    ]);

    // Map TopologyDevice[] to IDevice[] (lightweight, no interfaces)
    const devices: IDevice[] = (topologyResult.data ?? []).map((d) => ({
      id: 0,
      deviceId: d.deviceId,
      deviceName: d.deviceName || '',
      deviceType: d.deviceType || '',
      macAddress: d.macAddress,
      ipAddress: d.ipAddress,
      state: d.state as IDevice['state'],
      status: d.status as IDevice['status'],
      controllerId: d.controllerId || '',
      heartbeatTimer: d.heartbeatTimer,
      lastConnectedOn: '',
      createdBy: '',
      updatedBy: '',
      statusActionBy: '',
      createdAt: '',
      updatedAt: '',
      stateUpdatedAt: '',
      interfaces: [],
    }));

    yield put(
      fetchTreeTopologyDataSuccess({
        controllers: controllersResult.rows ?? [],
        devices,
      }),
    );
  } catch {
    yield put(
      fetchTreeTopologyDataFailure(
        'Unable to load tree topology data from backend.',
      ),
    );
  }
}

function* handleFetchSidebarDevice(
  action: PayloadAction<{ deviceId: string }>,
): SagaIterator {
  try {
    const { deviceId } = action.payload;
    const [deviceResult, heartbeatResult]: [
      { success: boolean; data: IDevice },
      {
        success: boolean;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { timestamp: string; data: any; timeout: number } | null;
      },
    ] = yield all([
      call(fetchDeviceDetailApi, deviceId),
      call(fetchLastHeartbeatApi, deviceId),
    ]);

    yield put(fetchSidebarDeviceSuccess(deviceResult.data));

    // Seed heartbeat timer from last heartbeat timestamp
    if (heartbeatResult?.data) {
      const lastTimestamp = new Date(heartbeatResult.data.timestamp).getTime();
      const now = Date.now();
      const timeout =
        deviceResult.data.heartbeatTimer || heartbeatResult.data.timeout || 999;
      const elapsedSeconds = Math.min(
        Math.floor((now - lastTimestamp) / 1000),
        999,
      );
      const timeoutMs = timeout * 1000;
      const isAlive = now - lastTimestamp < timeoutMs;

      yield put(
        seedHeartbeatFromBackend({
          deviceId,
          elapsedSeconds,
          data: {
            type: 'heartbeat' as const,
            deviceId,
            timestamp: heartbeatResult.data.timestamp,
            data: heartbeatResult.data.data,
          },
          isAlive,
        }),
      );
    } else {
      yield put(
        seedHeartbeatFromBackend({
          deviceId,
          elapsedSeconds: 0,
          data: null,
          isAlive: false,
        }),
      );
    }
  } catch {
    yield put(fetchSidebarDeviceFailure());
  }
}

export default function* watchTreeTopologyData(): SagaIterator {
  yield takeLatest(
    fetchTreeTopologyDataRequest.type,
    handleFetchTreeTopologyData,
  );
  yield takeLatest(fetchSidebarDeviceRequest.type, handleFetchSidebarDevice);
}
