import { call, put, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  fetchUserDevicesRequest,
  fetchUserDevicesSuccess,
  fetchUserDevicesFailure,
  toggleDevicePowerRequest,
  toggleDevicePowerSuccess,
  toggleDevicePowerFailure,
} from 'store/slices/userDevices/userDevicesSlice';
import {
  fetchDevicesForUser,
  toggleDevicePowerAPI,
} from 'services/deviceApiService';
import type { DeviceResponse, FetchDataQuery } from 'store/types/sagaTypes';
import type { IDevice } from 'typesCustom/types';
import { AxiosError } from 'axios';

function* fetchUserDevicesSaga(action: PayloadAction<FetchDataQuery>) {
  try {
    const response: DeviceResponse = yield call(
      fetchDevicesForUser,
      action.payload,
    );
    // Always replace data for userDevices screen to ensure fresh pagination
    const replace = true;
    yield put(fetchUserDevicesSuccess({ ...response, replace }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch devices';
    yield put(fetchUserDevicesFailure(message));
  }
}

function* toggleDevicePowerSaga(action: PayloadAction<string>) {
  try {
    const device: IDevice = yield call(toggleDevicePowerAPI, action.payload);
    yield put(toggleDevicePowerSuccess(device));
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data?.message) {
      yield put(toggleDevicePowerFailure(error.response?.data?.message));
    } else {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to toggle device power';
      yield put(toggleDevicePowerFailure(message));
    }
  }
}

export function* watchUserDevices() {
  yield takeLatest(fetchUserDevicesRequest.type, fetchUserDevicesSaga);
  yield takeLatest(toggleDevicePowerRequest.type, toggleDevicePowerSaga);
}

export default watchUserDevices;
