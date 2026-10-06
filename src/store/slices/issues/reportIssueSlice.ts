import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ReleaseAttributes } from 'typesCustom/tests';

type ReportIssueState = {
  loading: boolean;
  error: string | null;
  success: boolean;
  deviceFamilies: { items: string[]; loading: boolean; error?: string };
  deviceTypes: { items: string[]; loading: boolean; error?: string };
  builds: { items: ReleaseAttributes[]; loading: boolean; error?: string };
};

const initialState: ReportIssueState = {
  loading: false,
  error: null,
  success: false,
  deviceFamilies: { items: [], loading: false },
  deviceTypes: { items: [], loading: false },
  builds: { items: [], loading: false },
};

const reportIssueSlice = createSlice({
  name: 'reportIssue',
  initialState,
  reducers: {
    // Submit
    submitReportIssueRequest(
      state,
      _action: PayloadAction<{
        deviceFamily: string;
        deviceType: string;
        releaseId: string;
        description: string;
        file: File | null;
        attachLogs?: boolean;
        testExecutionId?: string | null;
      }>,
    ) {
      state.loading = true;
      state.error = null;
      state.success = false;
    },
    submitReportIssueSuccess(state) {
      state.loading = false;
      state.error = null;
      state.success = true;
    },
    submitReportIssueFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.success = false;
    },

    // Families
    fetchFamiliesRequest(state) {
      state.deviceFamilies.loading = true;
      state.deviceFamilies.error = undefined;
    },
    fetchFamiliesSuccess(state, action: PayloadAction<string[]>) {
      state.deviceFamilies.items = action.payload;
      state.deviceFamilies.loading = false;
    },
    fetchFamiliesFailure(state, action: PayloadAction<string>) {
      state.deviceFamilies.loading = false;
      state.deviceFamilies.error = action.payload;
    },

    // Device types
    fetchDeviceTypesRequest(
      state,
      _action: PayloadAction<{ deviceFamily: string }>,
    ) {
      state.deviceTypes.loading = true;
      state.deviceTypes.error = undefined;
      state.deviceTypes.items = [];
      state.builds.items = [];
    },
    fetchDeviceTypesSuccess(state, action: PayloadAction<string[]>) {
      state.deviceTypes.items = action.payload;
      state.deviceTypes.loading = false;
    },
    fetchDeviceTypesFailure(state, action: PayloadAction<string>) {
      state.deviceTypes.loading = false;
      state.deviceTypes.error = action.payload;
    },

    // Builds
    fetchBuildsRequest(state, _action: PayloadAction<{ deviceType: string }>) {
      state.builds.loading = true;
      state.builds.error = undefined;
      state.builds.items = [];
    },
    fetchBuildsSuccess(state, action: PayloadAction<ReleaseAttributes[]>) {
      state.builds.items = action.payload;
      state.builds.loading = false;
    },
    fetchBuildsFailure(state, action: PayloadAction<string>) {
      state.builds.loading = false;
      state.builds.error = action.payload;
    },

    resetReportIssueData(state) {
      state.deviceFamilies = { items: [], loading: false };
      state.deviceTypes = { items: [], loading: false };
      state.builds = { items: [], loading: false };
    },
    resetReportIssueState() {
      return initialState;
    },
  },
});

export const {
  submitReportIssueRequest,
  submitReportIssueSuccess,
  submitReportIssueFailure,
  fetchFamiliesRequest,
  fetchFamiliesSuccess,
  fetchFamiliesFailure,
  fetchDeviceTypesRequest,
  fetchDeviceTypesSuccess,
  fetchDeviceTypesFailure,
  fetchBuildsRequest,
  fetchBuildsSuccess,
  fetchBuildsFailure,
  resetReportIssueData,
  resetReportIssueState,
} = reportIssueSlice.actions;

export default reportIssueSlice.reducer;
