import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { DeviceResponse, FetchDataQuery } from 'store/types/sagaTypes';
import {
  DeviceState as DeviceStates,
  DeviceStatus,
} from 'typesCustom/components';
import { TestStatus } from 'typesCustom/tests';
import { DeviceDetail, DeviceStateChange, IDevice } from 'typesCustom/types';

interface DownloadState {
  downloading: boolean;
  error: string | null;
}

export interface DownloadFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

interface DeviceState {
  selectedDevice: IDevice | null;
  data: IDevice[];
  deviceDetails: DeviceDetail | null;
  totalPages: number;
  currentPage: number;
  totalDevices: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  dataFetched: boolean;
  download: DownloadState;
  message: string | null;
  deviceTimers: Record<string, number>;
  deviceTimeouts: Record<string, number>;
  requestedCount: number;
  userDevice: {
    data: IDevice[];
    totalPages: number;
    currentPage: number;
    totalDevices: number;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };
  deviceFamilies: {
    data: string[];
    loading: boolean;
    error: string | null;
  };
  deviceTypes: {
    data: string[];
    loading: boolean;
    error: string | null;
  };
  deviceBuilds: {
    data: Record<string, string[]>;
    loading: boolean;
    error: string | null;
  };
}

const initialState: DeviceState = {
  selectedDevice: null,
  deviceDetails: null,
  data: [],
  totalPages: 0,
  currentPage: 0,
  totalDevices: 0,
  loading: false,
  actionLoading: false,
  dataFetched: false,
  error: null,
  requestedCount: 0,
  download: {
    downloading: false,
    error: null,
  },
  message: null,
  deviceTimers: {},
  deviceTimeouts: {},
  userDevice: {
    data: [],
    totalPages: 0,
    currentPage: 0,
    totalDevices: 0,
    loading: false,
    error: null,
    dataFetched: false,
  },
  deviceFamilies: {
    data: [],
    loading: false,
    error: null,
  },
  deviceTypes: {
    data: [],
    loading: false,
    error: null,
  },
  deviceBuilds: {
    data: {},
    loading: false,
    error: null,
  },
};

const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    fetchDeviceRequest: (state, _action: PayloadAction<FetchDataQuery>) => {
      void _action;
      state.loading = true;
      state.error = null;
    },
    fetchDeviceSuccess: (state, action: PayloadAction<DeviceResponse>) => {
      state.loading = false;
      state.dataFetched = true;
      state.totalDevices = action.payload.totalDevices;
      state.totalPages = action.payload.totalPages;

      if (action.payload.replace) {
        state.data = action.payload.data;
      } else {
        const existingIds = new Set(
          state.data.map((device) => device.deviceId),
        );
        const newDevices = action.payload.data.filter(
          (device) => !existingIds.has(device.deviceId),
        );
        state.data = [...state.data, ...newDevices];
      }
      state.currentPage = action.payload.currentPage;
      state.deviceTimers = action.payload.deviceTimers;
      state.deviceTimeouts = action.payload.deviceTimeouts;
      state.requestedCount = action.payload.requestedCount;
    },
    updateSelectedDevice: (state, action: PayloadAction<IDevice | null>) => {
      state.selectedDevice = action.payload;
    },
    updateDeviceTimer: (
      state,
      action: PayloadAction<{ deviceId: string; timer: number }>,
    ) => {
      state.deviceTimers[action.payload.deviceId] = action.payload.timer;
    },
    fetchDeviceFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchDeviceDetailRequest: (
      _state,
      _action: PayloadAction<{ deviceId: string }>,
    ) => {
      void _action;
    },
    fetchDeviceDetailSuccess: (state, action: PayloadAction<DeviceDetail>) => {
      state.deviceDetails = action.payload;
    },
    fetchDeviceDetailFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    updateDeviceStatusRequest: (
      state,
      action: PayloadAction<{
        status: DeviceStatus;
        deviceID: string;
      }>,
    ) => {
      void action;
      state.actionLoading = true;
    },

    updateDeviceStatusSuccess: (state, action: PayloadAction<IDevice>) => {
      const updatedDevice = action.payload;
      const index = state.data.findIndex(
        (device) => device.deviceId === updatedDevice.deviceId,
      );
      if (index !== -1) {
        state.data[index] = updatedDevice;
      }
      state.actionLoading = false;
      state.error = null;
      state.message = `Device ${action.payload.deviceType} successfully ${action.payload.status}`;
      state.requestedCount = state.requestedCount - 1;
    },
    updateDeviceStatusFailure: (state, action: PayloadAction<string>) => {
      state.actionLoading = false;
      state.error = action.payload;
    },
    deleteDeviceRequest: (state, action: PayloadAction<string>) => {
      void action;
      state.actionLoading = true;
    },
    deleteDeviceSuccess: (state, action: PayloadAction<string>) => {
      const index = state.data.findIndex((d) => d.deviceId === action.payload);
      if (index !== -1) {
        state.data.splice(index, 1);
      }
      state.totalDevices = state.totalDevices - 1;

      state.message = 'Device deleted successfully';
      state.actionLoading = false;
      state.error = null;
    },
    deleteDeviceFailure: (state, action: PayloadAction<string>) => {
      state.actionLoading = false;
      state.error = action.payload;
    },
    heartbeatTimeoutRequest: (
      state,
      action: PayloadAction<{ deviceId: string; value: number }>,
    ) => {
      void state;
      void action;
      // state.actionLoading = true;
    },
    heartbeatTimeoutSuccess: (
      state,
      action: PayloadAction<{ deviceId: string; value: number }>,
    ) => {
      state.error = null;
      state.deviceTimeouts[action.payload.deviceId] = action.payload.value;
    },
    heartbeatTimeoutFailure: (state, action: PayloadAction<string>) => {
      // state.actionLoading = false;
      state.error = action.payload;
    },
    downloadDevicesRequest: (state, action: PayloadAction<DownloadFilters>) => {
      void action;
      state.download.downloading = true;
      state.download.error = null;
    },
    downloadDevicesSuccess: (state) => {
      state.download.downloading = false;
      state.download.error = null;
    },
    downloadDevicesFailure: (state, action: PayloadAction<string>) => {
      state.download.downloading = false;
      state.download.error = action.payload;
    },
    resetDevices: () => {
      return initialState;
    },
    clearDeviceMessage: (state) => {
      state.message = null;
      state.error = null;
    },
    deviceStateUpdate: (state, action: PayloadAction<DeviceStateChange>) => {
      if (action.payload.deviceId) {
        const deviceIndex = state.data.findIndex(
          (dev) => dev.deviceId === action.payload.deviceId,
        );
        if (deviceIndex !== -1) {
          state.data[deviceIndex].state = action.payload.state;
          state.data[deviceIndex].upgrading = action.payload.upgrading ?? false;
          state.data[deviceIndex].flashing = action.payload.flashing ?? false;
        }

        const userDeviceIndex = state.userDevice.data.findIndex(
          (dev) => dev.deviceId === action.payload.deviceId,
        );
        if (userDeviceIndex !== -1) {
          state.userDevice.data[userDeviceIndex].state = action.payload.state;
          state.userDevice.data[userDeviceIndex].upgrading =
            action.payload.upgrading ?? false;
          state.userDevice.data[userDeviceIndex].flashing =
            action.payload.flashing ?? false;
        }
      }
    },
    appendDevice: (state, action: PayloadAction<IDevice>) => {
      const exists = state.data.find((d) => d.id === action.payload.id);
      if (!exists) {
        state.data.unshift(action.payload);
        state.totalDevices += 1;
      }
    },
    fetchDevicesForUserRequest: (
      state,
      _action: PayloadAction<FetchDataQuery>,
    ) => {
      void _action;
      state.userDevice.loading = true;
      state.userDevice.error = null;
    },
    fetchDevicesForUserSuccess: (
      state,
      action: PayloadAction<DeviceResponse>,
    ) => {
      state.userDevice.loading = false;
      state.userDevice.dataFetched = true;
      state.userDevice.totalDevices = action.payload.totalDevices;
      state.userDevice.totalPages = action.payload.totalPages;
      state.userDevice.data = !action.payload.replace
        ? action.payload.currentPage === 1
          ? action.payload.data
          : [...state.userDevice.data, ...action.payload.data]
        : action.payload.data;
      state.userDevice.currentPage = action.payload.currentPage;
    },
    fetchDevicesForUserFailure: (state, action: PayloadAction<string>) => {
      state.userDevice.loading = false;
      state.userDevice.error = action.payload;
    },
    fetchDeviceFamiliesRequest: (state) => {
      state.deviceFamilies.loading = true;
      state.deviceFamilies.error = null;
    },
    fetchDeviceFamiliesSuccess: (state, action: PayloadAction<string[]>) => {
      state.deviceFamilies.loading = false;
      state.deviceFamilies.data = action.payload;
    },
    fetchDeviceFamiliesFailure: (state, action: PayloadAction<string>) => {
      state.deviceFamilies.loading = false;
      state.deviceFamilies.error = action.payload;
    },
    fetchDeviceTypesRequest: (state, _action: PayloadAction<string>) => {
      state.deviceTypes.loading = true;
      state.deviceTypes.error = null;
    },
    fetchDeviceTypesSuccess: (state, action: PayloadAction<string[]>) => {
      state.deviceTypes.loading = false;
      state.deviceTypes.data = action.payload;
    },
    fetchDeviceTypesFailure: (state, action: PayloadAction<string>) => {
      state.deviceTypes.loading = false;
      state.deviceTypes.error = action.payload;
    },
    fetchBuildsForDeviceRequest: (state, _action: PayloadAction<string>) => {
      state.deviceBuilds.loading = true;
      state.deviceBuilds.error = null;
    },
    fetchBuildsForDeviceSuccess: (
      state,
      action: PayloadAction<{ deviceId: string; data: string[] }>,
    ) => {
      state.deviceBuilds.loading = false;
      if (!state.deviceBuilds.data[action.payload.deviceId]) {
        state.deviceBuilds.data[action.payload.deviceId] = [];
      }
      state.deviceBuilds.data[action.payload.deviceId] = action.payload.data;
    },
    fetchBuildsForDeviceFailure: (state, action: PayloadAction<string>) => {
      state.deviceBuilds.loading = false;
      state.deviceBuilds.error = action.payload;
    },
    fetchBuildsForDeviceTypeRequest: (
      state,
      _action: PayloadAction<string>,
    ) => {
      void _action;
      state.deviceBuilds.loading = true;
      state.deviceBuilds.error = null;
    },
    fetchBuildsForDeviceTypeSuccess: (
      state,
      action: PayloadAction<{ deviceType: string; data: string[] }>,
    ) => {
      state.deviceBuilds.loading = false;
      state.deviceBuilds.data[action.payload.deviceType] = action.payload.data;
    },
    fetchBuildsForDeviceTypeFailure: (state, action: PayloadAction<string>) => {
      state.deviceBuilds.loading = false;
      state.deviceBuilds.error = action.payload;
    },
    updateDeviceState: (
      state,
      action: PayloadAction<{
        deviceId: string;
        state: DeviceStates;
        softwareVersion: string;
        lastExecutionStatus: TestStatus;
      }>,
    ) => {
      const {
        deviceId,
        state: newState,
        softwareVersion,
        lastExecutionStatus,
      } = action.payload;
      const index = state.data.findIndex(
        (device) => device.deviceId === deviceId,
      );
      if (index !== -1) {
        state.data[index].state = newState;
        if (softwareVersion) {
          state.data[index].softwareVersion = softwareVersion;
        }
        if (lastExecutionStatus) {
          state.data[index].lastExecutionStatus = lastExecutionStatus;
        }
      }
    },
  },
});

export const {
  fetchDeviceFailure,
  fetchDeviceRequest,
  fetchDeviceSuccess,
  updateDeviceStatusRequest,
  updateDeviceStatusSuccess,
  updateDeviceStatusFailure,
  deleteDeviceFailure,
  deleteDeviceRequest,
  deleteDeviceSuccess,
  downloadDevicesRequest,
  downloadDevicesFailure,
  downloadDevicesSuccess,
  resetDevices,
  clearDeviceMessage,
  appendDevice,
  heartbeatTimeoutFailure,
  heartbeatTimeoutRequest,
  heartbeatTimeoutSuccess,
  deviceStateUpdate,
  fetchDeviceDetailFailure,
  fetchDeviceDetailRequest,
  fetchDeviceDetailSuccess,
  fetchDevicesForUserFailure,
  fetchDevicesForUserRequest,
  fetchDevicesForUserSuccess,
  updateSelectedDevice,
  fetchDeviceFamiliesFailure,
  fetchDeviceFamiliesRequest,
  fetchDeviceFamiliesSuccess,
  fetchDeviceTypesFailure,
  fetchDeviceTypesRequest,
  fetchDeviceTypesSuccess,
  fetchBuildsForDeviceRequest,
  fetchBuildsForDeviceSuccess,
  fetchBuildsForDeviceFailure,
  fetchBuildsForDeviceTypeRequest,
  fetchBuildsForDeviceTypeSuccess,
  fetchBuildsForDeviceTypeFailure,
  updateDeviceState,
  updateDeviceTimer,
} = deviceSlice.actions;

export default deviceSlice.reducer;
