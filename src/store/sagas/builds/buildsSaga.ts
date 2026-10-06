import { call, put, select, takeLatest } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  fetchBuildFiltersRequest,
  fetchBuildFiltersSuccess,
  fetchBuildFiltersFailure,
  fetchBuildsRequest,
  fetchBuildsSuccess,
  fetchBuildsFailure,
  updateBuildFlagRequest,
  deleteBuildRequest,
  adminActionSuccess,
  adminActionFailure,
  setBuildsPage,
} from 'store/slices/builds/buildsSlice';
import {
  fetchBuildFilters,
  fetchBuilds,
  updateBuildFlag,
  deleteBuild,
} from 'services/buildAPIService';
import type { RootState } from 'store';
import type {
  BuildsFiltersResponse,
  BuildsQuery,
  BuildsListResponse,
} from 'types/builds';
import { toastService } from 'services/ToastService';

// Fetch filters handler
function* handleFetchFilters() {
  try {
    const filters: BuildsFiltersResponse = yield call(fetchBuildFilters);
    yield put(fetchBuildFiltersSuccess(filters));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch filters';
    yield put(fetchBuildFiltersFailure(message));
  }
}

// Fetch builds handler
function* handleFetchBuilds(action: PayloadAction<BuildsQuery>) {
  try {
    const response: BuildsListResponse = yield call(
      fetchBuilds,
      action.payload,
    );
    yield put(fetchBuildsSuccess(response));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch builds';
    yield put(fetchBuildsFailure(message));
  }
}

// Update flag handler
function* handleUpdateFlag(
  action: PayloadAction<{ id: string; isFaulty: boolean }>,
): Generator<unknown, void, RootState> {
  try {
    yield call(updateBuildFlag, action.payload.id, action.payload.isFaulty);
    yield put(adminActionSuccess());

    // No need to refetch - WebSocket broadcast will handle updates for all users
    // The state is already updated via updateBuildFlagInState from WebSocket handler
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update flag';
    yield put(adminActionFailure(message));
    toastService.error(message, { clearExisting: false, autoClose: 3000 });
  }
}

// Delete build handler
function* handleDeleteBuild(
  action: PayloadAction<{ id: string }>,
): Generator<unknown, void, RootState> {
  try {
    yield call(deleteBuild, action.payload.id);
    yield put(adminActionSuccess());
    toastService.success('Build deleted successfully', {
      clearExisting: false,
      autoClose: 3000,
    });

    const state: RootState = yield select((state: RootState) => state);
    const s = state.builds;

    // Check if we're deleting the last item on the current page
    const currentPageItems = s.data?.length ?? 0;
    const currentPage = s.page ?? 0;
    const shouldGoToPreviousPage = currentPageItems === 1 && currentPage > 0;

    const query: BuildsQuery = {
      search: s.search || undefined,
      deviceType: s.deviceType || undefined,
      deviceFamily: s.deviceFamily || undefined,
      flagged: s.flagged,
      buildVersion: s.buildVersion || undefined,
      page: shouldGoToPreviousPage ? currentPage : currentPage + 1,
      limit: s.rowsPerPage ?? 8,
      sortBy: s.sortBy || undefined,
      sortOrder: s.sortOrder || undefined,
      silent: true,
    };

    // Update page if needed before fetching
    if (shouldGoToPreviousPage) {
      yield put(setBuildsPage(currentPage - 1));
    }

    yield put(fetchBuildsRequest(query));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete build';
    yield put(adminActionFailure(message));
    toastService.error(`Failed to delete build: ${message}`, {
      clearExisting: false,
      autoClose: 5000,
    });
  }
}

// Root saga
export default function* watchBuilds(): SagaIterator {
  yield takeLatest(fetchBuildFiltersRequest.type, handleFetchFilters);
  yield takeLatest(fetchBuildsRequest.type, handleFetchBuilds);
  yield takeLatest(updateBuildFlagRequest.type, handleUpdateFlag);
  yield takeLatest(deleteBuildRequest.type, handleDeleteBuild);
}
