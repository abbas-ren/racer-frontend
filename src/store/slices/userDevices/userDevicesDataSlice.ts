import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DeviceResponse, FetchDataQuery } from 'store/types/sagaTypes';
import type { IDevice } from 'typesCustom/types';

export interface UserDevicesDataState {
  data: IDevice[];
  totalPages: number;
  currentPage: number;
  totalDevices: number;
  loading: boolean;
  error: string | null;
  dataFetched: boolean;
}

const initialState: UserDevicesDataState = {
  data: [],
  totalPages: 0,
  currentPage: 0,
  totalDevices: 0,
  loading: false,
  error: null,
  dataFetched: false,
};

const userDevicesDataSlice = createSlice({
  name: 'userDevicesData',
  initialState,
  reducers: {
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
    resetUserDevicesData: () => initialState,
  },
});

export const {
  fetchUserDevicesRequest,
  fetchUserDevicesSuccess,
  fetchUserDevicesFailure,
  resetUserDevicesData,
} = userDevicesDataSlice.actions;

export default userDevicesDataSlice.reducer;
