import { call, put, takeLatest } from 'redux-saga/effects';
import type { SagaIterator } from 'redux-saga';
import { submitReportIssue } from 'services/reportIssueService';
import {
  submitReportIssueRequest,
  submitReportIssueSuccess,
  submitReportIssueFailure,
} from 'store/slices/issues/reportIssueSlice';
import { toastService } from 'services/ToastService';
import {
  fetchFamiliesRequest,
  fetchFamiliesSuccess,
  fetchFamiliesFailure,
  fetchDeviceTypesRequest,
  fetchDeviceTypesSuccess,
  fetchDeviceTypesFailure,
  fetchBuildsRequest,
  fetchBuildsSuccess,
  fetchBuildsFailure,
} from 'store/slices/issues/reportIssueSlice';
import {
  fetchDeviceFamilies as apiFetchDeviceFamilies,
  fetchDeviceTypes as apiFetchDeviceTypes,
  fetchBuildsForDeviceType as apiFetchBuildsForDeviceType,
} from 'services/deviceApiService';
// Dialog is independent from tab; no activeTab

function* handleSubmitReportIssue(
  action: ReturnType<typeof submitReportIssueRequest>,
): SagaIterator {
  try {
    const payload = action.payload;
    yield call(submitReportIssue, {
      deviceFamily: payload.deviceFamily,
      deviceType: payload.deviceType,
      releaseId: payload.releaseId,
      description: payload.description,
      file: payload.file,
      attachLogs: payload.attachLogs,
      testExecutionId: payload.testExecutionId,
    });
    yield put(submitReportIssueSuccess());
    toastService.success('Issue reported successfully.');
  } catch (e: any) {
    // Extract error message from backend response
    const errorMessage =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      'Failed to report issue';

    yield put(submitReportIssueFailure(errorMessage));
    toastService.error(errorMessage);
  }
}

function* handleFetchFamilies(): SagaIterator {
  try {
    const families: string[] = yield call(apiFetchDeviceFamilies);
    yield put(fetchFamiliesSuccess(families));
  } catch (e) {
    yield put(
      fetchFamiliesFailure((e as Error)?.message || 'Failed to fetch families'),
    );
  }
}

function* handleFetchDeviceTypes(
  action: ReturnType<typeof fetchDeviceTypesRequest>,
): SagaIterator {
  try {
    const deviceFamily = action.payload.deviceFamily;
    const types: string[] = yield call(apiFetchDeviceTypes, deviceFamily);
    yield put(fetchDeviceTypesSuccess(types));
  } catch (e) {
    yield put(
      fetchDeviceTypesFailure(
        (e as Error)?.message || 'Failed to fetch device types',
      ),
    );
  }
}

function* handleFetchBuilds(
  action: ReturnType<typeof fetchBuildsRequest>,
): SagaIterator {
  try {
    const deviceType = action.payload.deviceType;
    const builds = yield call(apiFetchBuildsForDeviceType, deviceType);
    yield put(fetchBuildsSuccess(builds));
  } catch (e) {
    yield put(
      fetchBuildsFailure((e as Error)?.message || 'Failed to fetch builds'),
    );
  }
}

export default function* watchReportIssue(): SagaIterator {
  yield takeLatest(submitReportIssueRequest.type, handleSubmitReportIssue);
  yield takeLatest(fetchFamiliesRequest.type, handleFetchFamilies);
  yield takeLatest(fetchDeviceTypesRequest.type, handleFetchDeviceTypes);
  yield takeLatest(fetchBuildsRequest.type, handleFetchBuilds);
}
