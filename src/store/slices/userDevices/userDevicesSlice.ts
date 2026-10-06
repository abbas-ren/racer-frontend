import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DeviceResponse, FetchDataQuery } from 'store/types/sagaTypes';
import type { IDevice } from 'typesCustom/types';
import { DevicePowerChange, DeviceStateChange } from 'typesCustom/types';
import { DeviceState } from 'typesCustom/components';

export type UserDevicesSortOrder = 'asc' | 'desc';

export interface UserDevicesState {
  // UI State (filters, sort, pagination)
  search: string;
  status: DeviceState | 'all';
  sortBy: 'deviceName' | 'lastTestExecution' | 'softwareVersion';
  sortOrder: UserDevicesSortOrder;
  page: number;
  rowsPerPage: number;

  // Data State
  data: IDevice[];
  totalPages: number;
  currentPage: number;
  totalDevices: number;
  loading: boolean;
  error: string | null;
  dataFetched: boolean;

  // Power Toggle State
  powerToggleLoading: boolean;
  powerToggleError: string | null;

  // WebSocket refresh trigger
  refreshTrigger: number;
}

const initialState: UserDevicesState = {
  // UI State
  search: '',
  status: 'all',
  sortBy: 'deviceName',
  sortOrder: 'asc',
  page: 0,
  rowsPerPage: 10,

  // Data State
  data: [],
  totalPages: 0,
  currentPage: 0,
  totalDevices: 0,
  loading: false,
  error: null,
  dataFetched: false,

  // Power Toggle State
  powerToggleLoading: false,
  powerToggleError: null,

  // WebSocket refresh trigger
  refreshTrigger: 0,
};

const userDevicesSlice = createSlice({
  name: 'userDevices',
  initialState,
  reducers: {
    // UI Actions
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 0;
    },
    setStatus(state, action: PayloadAction<DeviceState | 'all'>) {
      state.status = action.payload;
      state.page = 0;
    },
    setSort(
      state,
      action: PayloadAction<{
        sortBy: UserDevicesState['sortBy'];
        sortOrder: UserDevicesSortOrder;
      }>,
    ) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      state.page = 0;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setRowsPerPage(state, action: PayloadAction<number>) {
      state.rowsPerPage = action.payload;
      state.page = 0;
    },

    // Data Actions
    fetchUserDevicesRequest: (
      state,
      _action: PayloadAction<FetchDataQuery>,
    ) => {
      void _action;
      state.loading = true;
      state.error = null;
    },
    fetchUserDevicesSuccess: (state, action: PayloadAction<DeviceResponse>) => {
      state.loading = false;
      state.dataFetched = true;
      state.totalDevices = action.payload.totalDevices;
      state.totalPages = action.payload.totalPages;
      state.data = !action.payload.replace
        ? action.payload.currentPage === 1
          ? action.payload.data
          : [...state.data, ...action.payload.data]
        : action.payload.data;
      state.currentPage = action.payload.currentPage;
    },
    fetchUserDevicesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Trigger a full re-fetch (e.g. when a new device appears via WebSocket)
    triggerDevicesRefresh(state) {
      state.refreshTrigger += 1;
    },

    // Handle device state updates from WebSocket
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
      }
    },

    // Handle device power updates from WebSocket
    devicePowerUpdate: (state, action: PayloadAction<DevicePowerChange>) => {
      if (action.payload.deviceId) {
        const deviceIndex = state.data.findIndex(
          (dev) => dev.deviceId === action.payload.deviceId,
        );
        if (deviceIndex !== -1) {
          state.data[deviceIndex].power = action.payload.power;
        }
      }
    },

    // Power Toggle Actions
    toggleDevicePowerRequest: (state, _action: PayloadAction<string>) => {
      void _action;
      state.powerToggleLoading = true;
      state.powerToggleError = null;
    },
    toggleDevicePowerSuccess: (state, action: PayloadAction<IDevice>) => {
      state.powerToggleLoading = false;
      const deviceIndex = state.data.findIndex(
        (dev) => dev.deviceId === action.payload.deviceId,
      );
      if (deviceIndex !== -1) {
        state.data[deviceIndex] = action.payload;
      }
    },
    toggleDevicePowerFailure: (state, action: PayloadAction<string>) => {
      state.powerToggleLoading = false;
      state.powerToggleError = action.payload;
    },

    // Reset
    resetUserDevices: () => initialState,
  },
});

export const {
  setSearch,
  setStatus,
  setSort,
  setPage,
  setRowsPerPage,
  fetchUserDevicesRequest,
  fetchUserDevicesSuccess,
  fetchUserDevicesFailure,
  triggerDevicesRefresh,
  deviceStateUpdate,
  devicePowerUpdate,
  toggleDevicePowerRequest,
  toggleDevicePowerSuccess,
  toggleDevicePowerFailure,
  resetUserDevices,
} = userDevicesSlice.actions;

export default userDevicesSlice.reducer;
