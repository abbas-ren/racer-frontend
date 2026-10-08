import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { DeviceResponse } from 'store/types/sagaTypes';
import {
  deleteDeviceFailure,
  deleteDeviceRequest,
  deleteDeviceSuccess,
  downloadDevicesFailure,
  downloadDevicesRequest,
  downloadDevicesSuccess,
  fetchDeviceDetailFailure,
  fetchDeviceDetailRequest,
  fetchDeviceDetailSuccess,
  fetchDeviceRequest,
  fetchDeviceSuccess,
  heartbeatTimeoutFailure,
  heartbeatTimeoutRequest,
  heartbeatTimeoutSuccess,
  updateDeviceStatusFailure,
  updateDeviceStatusRequest,
  updateDeviceStatusSuccess,
  fetchDevicesForUserFailure,
  fetchDevicesForUserRequest,
  fetchDevicesForUserSuccess,
  fetchDeviceFamiliesRequest,
  fetchDeviceFamiliesFailure,
  fetchDeviceFamiliesSuccess,
  fetchBuildsForDeviceRequest,
  fetchBuildsForDeviceFailure,
  fetchBuildsForDeviceSuccess,
  fetchBuildsForDeviceTypeRequest,
  fetchBuildsForDeviceTypeFailure,
  deviceStateUpdate,
  fetchDeviceTypesRequest,
  fetchDeviceTypesSuccess,
  fetchDeviceTypesFailure,
} from 'store/slices/device/deviceSlice';
import {
  fetchLastHeartbeatRequest,
  seedHeartbeatFromBackend,
} from 'store/slices/deviceHeartbeat/deviceHeartbeatSlice';
import {
  deleteDeviceAPI,
  downloadDevicesCSV,
  fetchBuildsForDevice,
  fetchBuildsForDeviceType,
  fetchDeviceApi,
  fetchDeviceDetailsApi,
  fetchDeviceFamilies,
  fetchDevicesForUser,
  fetchDeviceTypes,
  fetchLastHeartbeatApi,
  saveHeartbeatTimeoutAPI,
  updateDeviceStatusAPI,
} from 'services/deviceApiService';
import { PayloadAction } from '@reduxjs/toolkit';
import { DeviceDetail, IDevice } from 'typesCustom/types';
import { DeviceState, DeviceStatus } from 'typesCustom/components';
import { RootState } from 'store/store';
import { AxiosError } from 'axios';

const getUserDevices = (state: RootState) => state.device.userDevice;
const getSelectedData = (state: RootState) => state.tests.selectedData;

function* fetchDeviceSaga(action: ReturnType<typeof fetchDeviceRequest>) {
  try {
    const response: DeviceResponse = yield call(fetchDeviceApi, action.payload);

    if (action.payload.screen) {
      const replace = true;
      yield put(fetchDeviceSuccess({ ...response, replace }));
    } else {
      yield put(fetchDeviceSuccess(response));
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        updateDeviceStatusFailure(error.message || 'Failed to fetch devices'),
      );
    } else {
      yield put(updateDeviceStatusFailure('Failed to fetch devices'));
    }
  }
}
function* fetchDeviceDetailsSaga(action: PayloadAction<{ deviceId: string }>) {
  try {
    const response: { data: DeviceDetail } = yield call(
      fetchDeviceDetailsApi,
      action.payload,
    );

    yield put(fetchDeviceDetailSuccess(response?.data));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDeviceDetailFailure(error.message || 'Failed to fetch devices'),
      );
    } else {
      yield put(fetchDeviceDetailFailure('Failed to fetch devices'));
    }
  }
}

function* fetchDevicesForUserSaga(
  action: ReturnType<typeof fetchDevicesForUserRequest>,
) {
  try {
    const response: DeviceResponse = yield call(
      fetchDevicesForUser,
      action.payload,
    );
    if (action.payload.screen) {
      const replace = true;
      yield put(fetchDevicesForUserSuccess({ ...response, replace }));
    } else {
      yield put(fetchDevicesForUserSuccess(response));
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDevicesForUserFailure(error.message || 'Failed to fetch devices'),
      );
    } else {
      yield put(fetchDevicesForUserFailure('Failed to fetch devices'));
    }
  }
}

function* updateDeviceStatus(
  action: ReturnType<typeof updateDeviceStatusRequest>,
) {
  try {
    const response: { data: IDevice } = yield call(
      updateDeviceStatusAPI,
      action.payload,
    );
    if (action.payload.status === DeviceStatus.DECLINED) {
      yield put(deleteDeviceSuccess(action.payload.deviceID));
    } else {
      yield put(updateDeviceStatusSuccess(response.data));
    }
  } catch (error) {
    if (
      error instanceof AxiosError &&
      error.response?.data?.message &&
      error.status === 409
    ) {
      yield put(updateDeviceStatusFailure(error.response?.data?.message));
    } else if (error instanceof Error) {
      yield put(
        updateDeviceStatusFailure(
          error.message || 'Failed to update device status',
        ),
      );
    } else {
      yield put(updateDeviceStatusFailure('Failed to update device status'));
    }
  }
}

function* deleteDeviceSaga(
  action: PayloadAction<{ deviceId: string; force?: boolean }>,
) {
  try {
    yield call(deleteDeviceAPI, action.payload);
    yield put(deleteDeviceSuccess(action.payload.deviceId));
    // yield put(
    //   fetchDeviceRequest({
    //     page: '1',
    //     limit: '10',
    //     sortBy: 'createdAt',
    //     desc: 'true',
    //   }),
    // );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        deleteDeviceFailure(error.message || 'Failed to delete device'),
      );
    } else {
      yield put(deleteDeviceFailure('Failed to delete device'));
    }
  }
}
function* handleHeartbeatTimeout(
  action: PayloadAction<{ deviceId: string; value: number }>,
) {
  try {
    yield call(saveHeartbeatTimeoutAPI, action.payload);
    yield put(heartbeatTimeoutSuccess(action.payload));
  } catch (error) {
    yield put(heartbeatTimeoutFailure('Failed to save heartbeat timeout'));
  }
}

function* downloadDevicesSaga(
  action: ReturnType<typeof downloadDevicesRequest>,
) {
  try {
    const blob: Blob = yield call(downloadDevicesCSV, action.payload);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devices-${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    yield put(downloadDevicesSuccess());
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        downloadDevicesFailure(error.message || 'Failed to download CSV'),
      );
    } else {
      yield put(downloadDevicesFailure('Failed to download CSV'));
    }
  }
}

function* fetchDeviceFamiliesSaga() {
  try {
    const response: string[] = yield call(fetchDeviceFamilies);
    yield put(fetchDeviceFamiliesSuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDeviceFamiliesFailure(
          error.message || 'Failed to fetch device families',
        ),
      );
    } else {
      yield put(fetchDeviceFamiliesFailure('Failed to fetch device families'));
    }
  }
}

function* fetchBuildsForDeviceTypeSaga(
  action: ReturnType<typeof fetchBuildsForDeviceTypeRequest>,
) {
  try {
    const response: string[] = yield call(
      fetchBuildsForDeviceType,
      action.payload,
    );
    yield put(
      fetchBuildsForDeviceSuccess({
        deviceId: action.payload,
        data: response,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchBuildsForDeviceTypeFailure(
          error.message || 'Failed to fetch builds for device type',
        ),
      );
    } else {
      yield put(
        fetchBuildsForDeviceTypeFailure(
          'Failed to fetch builds for device type',
        ),
      );
    }
  }
}

function* fetchBuildsForDeviceSaga(
  action: ReturnType<typeof fetchBuildsForDeviceRequest>,
) {
  try {
    const response: string[] = yield call(fetchBuildsForDevice, action.payload);
    yield put(
      fetchBuildsForDeviceSuccess({
        deviceId: action.payload,
        data: response,
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchBuildsForDeviceFailure(
          error.message || 'Failed to fetch builds for device',
        ),
      );
    } else {
      yield put(
        fetchBuildsForDeviceFailure('Failed to fetch builds for device'),
      );
    }
  }
}

function* handleDeviceStateUpdate(
  action: ReturnType<typeof deviceStateUpdate>,
) {
  if (action.payload.deviceId) {
    const userDevices: ReturnType<typeof getUserDevices> =
      yield select(getUserDevices);

    const deviceIndex = userDevices.data.findIndex(
      (dev) => dev.deviceId === action.payload.deviceId,
    );

    const selectedData: ReturnType<typeof getSelectedData> =
      yield select(getSelectedData);

    if (deviceIndex === -1) {
      if (action.payload.state === DeviceState.AVAILABLE) {
        yield put(
          fetchDevicesForUserRequest({
            deviceFamily: selectedData.deviceFamily || 'ALL',
            sortBy: 'createdAt',
            limit: '10',
            page: userDevices.currentPage.toString(),
            desc: 'true',
          }),
        );
      }
    }
  }
}

function* fetchDeviceTypesSaga(
  action: ReturnType<typeof fetchDeviceTypesRequest>,
) {
  try {
    const response: string[] = yield call(fetchDeviceTypes, action.payload);
    yield put(fetchDeviceTypesSuccess(response));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchDeviceTypesFailure(
          error.message || 'Failed to fetch device types',
        ),
      );
    } else {
      yield put(fetchDeviceTypesFailure('Failed to fetch device types'));
    }
  }
}

function* fetchLastHeartbeatSaga(
  action: PayloadAction<{ deviceId: string; timeout: number }>,
) {
  try {
    const { deviceId, timeout } = action.payload;
    const response: {
      success: boolean;
      data: { timestamp: string; data: any; timeout: number } | null;
    } = yield call(fetchLastHeartbeatApi, deviceId);

    if (response?.data) {
      const lastTimestamp = new Date(response.data.timestamp).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.min(
        Math.floor((now - lastTimestamp) / 1000),
        999,
      );
      const timeoutMs = (timeout || response.data.timeout || 999) * 1000;
      const isAlive = now - lastTimestamp < timeoutMs;

      yield put(
        seedHeartbeatFromBackend({
          deviceId,
          elapsedSeconds,
          data: {
            type: 'heartbeat' as const,
            deviceId,
            timestamp: response.data.timestamp,
            data: response.data.data,
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
  } catch (error) {
    // Silently fail - heartbeat will still come via socket
  }
}

export function* watchDevice() {
  yield takeLatest(fetchDeviceRequest.type, fetchDeviceSaga);
  yield takeLatest(fetchDeviceDetailRequest.type, fetchDeviceDetailsSaga);
  yield takeLatest(updateDeviceStatusRequest.type, updateDeviceStatus);
  yield takeLatest(deleteDeviceRequest.type, deleteDeviceSaga);
  yield takeLatest(downloadDevicesRequest.type, downloadDevicesSaga);
  yield takeLatest(heartbeatTimeoutRequest.type, handleHeartbeatTimeout);
  yield takeLatest(fetchDevicesForUserRequest.type, fetchDevicesForUserSaga);
  yield takeLatest(fetchDeviceFamiliesRequest.type, fetchDeviceFamiliesSaga);
  yield takeLatest(fetchDeviceTypesRequest.type, fetchDeviceTypesSaga);
  yield takeLatest(fetchBuildsForDeviceRequest.type, fetchBuildsForDeviceSaga);
  yield takeLatest(
    fetchBuildsForDeviceTypeRequest.type,
    fetchBuildsForDeviceTypeSaga,
  );
  yield takeLatest(deviceStateUpdate.type, handleDeviceStateUpdate);
  yield takeLatest(fetchLastHeartbeatRequest.type, fetchLastHeartbeatSaga);
}

export default watchDevice;
