import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  BuildsFiltersResponse,
  BuildsQuery,
  BuildsListResponse,
  BuildRelease,
} from 'types/builds';

interface BuildsState {
  // List view state
  search: string;
  deviceType: string;
  deviceFamily: string;
  flagged: boolean | undefined;
  buildVersion: string;
  page: number;
  rowsPerPage: number;
  sortBy: string | undefined;
  sortOrder: 'asc' | 'desc' | undefined;

  // List data
  data: BuildRelease[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  dataFetched: boolean;
  filters: BuildsFiltersResponse;
}

const initialState: BuildsState = {
  // List view state
  search: '',
  deviceType: '',
  deviceFamily: '',
  flagged: undefined,
  buildVersion: '',
  page: 0,
  rowsPerPage: 10,
  sortBy: undefined,
  sortOrder: undefined,

  // List data
  data: [],
  totalCount: 0,
  loading: false,
  error: null,
  dataFetched: false,
  filters: { deviceFamilies: [], deviceTypes: [] },
};

const buildsSlice = createSlice({
  name: 'builds',
  initialState,
  reducers: {
    // List view actions
    setBuildsSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 0;
    },
    setBuildsDeviceType(state, action: PayloadAction<string>) {
      state.deviceType = action.payload;
      state.page = 0;
    },
    setBuildsDeviceFamily(state, action: PayloadAction<string>) {
      state.deviceFamily = action.payload;
      state.page = 0;
    },
    setBuildsFlagged(state, action: PayloadAction<boolean | undefined>) {
      state.flagged = action.payload;
      state.page = 0;
    },
    setBuildsVersion(state, action: PayloadAction<string>) {
      state.buildVersion = action.payload;
      state.page = 0;
    },
    setBuildsPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setBuildsRowsPerPage(state, action: PayloadAction<number>) {
      state.rowsPerPage = action.payload;
      state.page = 0;
    },
    setBuildsSort(
      state,
      action: PayloadAction<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>,
    ) {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    // Fetch filters
    fetchBuildFiltersRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchBuildFiltersSuccess(
      state,
      action: PayloadAction<BuildsFiltersResponse>,
    ) {
      state.loading = false;
      state.filters = action.payload;
    },
    fetchBuildFiltersFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Fetch builds list
    fetchBuildsRequest(
      state,
      action: PayloadAction<BuildsQuery & { silent?: boolean }>,
    ) {
      // Only set loading for user-initiated fetches, not background refreshes
      if (!action.payload.silent) {
        state.loading = true;
      }
      state.error = null;
    },
    fetchBuildsSuccess(state, action: PayloadAction<BuildsListResponse>) {
      state.loading = false;
      state.dataFetched = true;
      state.data = action.payload.builds ?? [];
      state.totalCount =
        action.payload.totalCount ?? (action.payload.builds?.length || 0);
    },
    fetchBuildsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    // Admin actions
    updateBuildFlagRequest(
      state,
      _action: PayloadAction<{ id: string; isFaulty: boolean }>,
    ) {
      void _action;
      // Don't set loading - flag updates happen instantly via WebSocket
      state.error = null;
    },
    updateBuildFlagInState(
      state,
      action: PayloadAction<{ releaseId: string; isFaulty: boolean }>,
    ) {
      // Update the flag status of a specific build without refetching
      const build = state.data.find((b) => b.id === action.payload.releaseId);
      if (build) {
        build.isFaulty = action.payload.isFaulty;
        build.status = action.payload.isFaulty ? 'failed' : 'passed';
      }
    },
    updateBuildStatusInState(
      state,
      action: PayloadAction<{
        releaseId: string;
        status?: string;
        isFaulty?: boolean;
      }>,
    ) {
      const build = state.data.find((b) => b.id === action.payload.releaseId);
      if (!build) {
        return;
      }

      if (action.payload.status !== undefined) {
        build.status = action.payload.status;
      }

      if (typeof action.payload.isFaulty === 'boolean') {
        build.isFaulty = action.payload.isFaulty;
      } else if (action.payload.status) {
        const normalized = action.payload.status.toLowerCase();
        if (normalized === 'failed') {
          build.isFaulty = true;
        } else if (normalized === 'passed') {
          build.isFaulty = false;
        }
      }
    },
    removeBuildFromState(state, action: PayloadAction<{ releaseId: string }>) {
      // Remove a build from state without refetching
      state.data = state.data.filter((b) => b.id !== action.payload.releaseId);
      state.totalCount = Math.max(0, state.totalCount - 1);
    },
    deleteBuildRequest(state, _action: PayloadAction<{ id: string }>) {
      void _action;
      state.loading = true;
      state.error = null;
    },
    adminActionSuccess(state) {
      // Don't set loading to false - let it remain unchanged
      // This prevents triggering the transition effect
      void state;
    },
    adminActionFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    resetBuildsState: () => initialState,
  },
});

export const {
  setBuildsSearch,
  setBuildsDeviceType,
  setBuildsDeviceFamily,
  setBuildsFlagged,
  setBuildsVersion,
  setBuildsPage,
  setBuildsRowsPerPage,
  setBuildsSort,
  fetchBuildFiltersRequest,
  fetchBuildFiltersSuccess,
  fetchBuildFiltersFailure,
  fetchBuildsRequest,
  fetchBuildsSuccess,
  fetchBuildsFailure,
  updateBuildFlagRequest,
  updateBuildFlagInState,
  updateBuildStatusInState,
  removeBuildFromState,
  deleteBuildRequest,
  adminActionSuccess,
  adminActionFailure,
  resetBuildsState,
} = buildsSlice.actions;

export default buildsSlice.reducer;
