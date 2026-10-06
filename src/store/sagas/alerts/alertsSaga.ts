import { PayloadAction } from '@reduxjs/toolkit';
import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchAllAlerts,
  markAllasAlertRead,
  markSingleAlertRead,
} from 'services/alertApiService';
import {
  fetchFaultyReportById,
  fetchFaultyReportLogsContent,
} from 'services/reportIssueService';
import { fetchDeviceDetailsApi } from 'services/deviceApiService';
import { fetchAllDeviceControllers } from 'services/deviceControllerAPIService';
import {
  FetchAlertsRequestPayload,
  fetchAlertDetailFailure,
  fetchAlertDetailRequest,
  fetchAlertDetailSuccess,
  fetchAlertFailure,
  fetchAlertRequest,
  fetchAlertSuccess,
  markAllAsReadFailure,
  markAllAsReadRequest,
  markAllAsReadSuccess,
  readAlertFailure,
  readAlertRequest,
  readAlertSuccess,
} from 'store/slices/alerts/alertsSlice';
import { Alerts } from 'store/types/sagaTypes';
import { AlertItem } from 'components/Dashboard/AdminDashboard/types';
import { DeviceDetail } from 'typesCustom/types';

const getFileNameFromPath = (filePath?: string | null) => {
  if (!filePath) return undefined;
  const segments = filePath.split('/').filter(Boolean);
  return segments[segments.length - 1];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const extractDeviceDetail = (
  response: unknown,
): Partial<DeviceDetail> | null => {
  if (!isRecord(response)) {
    return null;
  }

  if (isRecord(response.data)) {
    return response.data as Partial<DeviceDetail>;
  }

  return response as Partial<DeviceDetail>;
};

function* fetchAlertsSaga(action: PayloadAction<FetchAlertsRequestPayload>) {
  try {
    const response: {
      data: Alerts[];
      totalPages: number;
      currentPage: number;
      totalData: number;
      totalUnreadCount?: number;
    } = yield call(fetchAllAlerts, action.payload);

    yield put(
      fetchAlertSuccess({
        ...response,
        append: action.payload.append,
      }),
    );
  } catch {
    yield put(fetchAlertFailure('Failed to fetch alerts'));
  }
}
function* markReadAlertsSaga(action: PayloadAction<string>) {
  try {
    yield call(markSingleAlertRead, action.payload);

    yield put(readAlertSuccess(action.payload));
  } catch {
    yield put(readAlertFailure('Failed to mark alert read'));
  }
}
function* markAllasReadAlertsSaga() {
  try {
    yield call(markAllasAlertRead);

    yield put(markAllAsReadSuccess('Success'));
  } catch {
    yield put(markAllAsReadFailure('Failed to mark alert read'));
  }
}

function* fetchAlertDetailSaga(action: PayloadAction<AlertItem>) {
  try {
    const enriched: AlertItem = { ...action.payload };

    if (action.payload.faultyReportId) {
      try {
        const report: {
          description: string;
          createdBy: string;
          reporterName?: string;
          deviceFamily?: string;
          deviceType?: string;
          releaseId?: string;
          filePath?: string | null;
          logsPath?: string | null;
          buildVersion?: string;
        } = yield call(fetchFaultyReportById, action.payload.faultyReportId);

        enriched.desc = report.description || enriched.desc;
        enriched.submittedBy =
          report.reporterName || report.createdBy || enriched.submittedBy;
        enriched.deviceFamily = report.deviceFamily || enriched.deviceFamily;
        enriched.deviceType = report.deviceType || enriched.deviceType;
        enriched.buildId = report.releaseId || enriched.buildId;
        enriched.buildVersion = report.buildVersion || enriched.buildVersion;
        enriched.filePath = report.filePath || undefined;
        enriched.logsPath = report.logsPath || undefined;
        enriched.attachmentName =
          getFileNameFromPath(report.filePath) || enriched.attachmentName;

        if (report.logsPath) {
          try {
            enriched.testLogs = yield call(
              fetchFaultyReportLogsContent,
              action.payload.faultyReportId,
            );
          } catch {
            enriched.testLogs =
              'Unable to load log preview. Use Download Logs.';
          }
        }
      } catch {
        // Keep base alert payload when detail API fails.
      }
    } else if (action.payload.deviceControllerId) {
      try {
        const response: {
          data: Array<{
            deviceControllerId: string;
            ipAddress?: string;
            deviceFamily?: string;
          }>;
        } = yield call(fetchAllDeviceControllers, {
          search: action.payload.deviceControllerId,
          page: 1,
          limit: 10,
        });

        const exactController = response.data.find(
          (controller) =>
            controller.deviceControllerId === action.payload.deviceControllerId,
        );
        if (exactController) {
          enriched.deviceController = exactController.deviceControllerId;
          enriched.ipAddress = exactController.ipAddress || enriched.ipAddress;
          enriched.deviceFamily =
            exactController.deviceFamily || enriched.deviceFamily;
        }
      } catch {
        // Keep base alert payload when detail API fails.
      }
    } else if (action.payload.deviceId) {
      try {
        const response: unknown = yield call(fetchDeviceDetailsApi, {
          deviceId: action.payload.deviceId,
        });

        const device = extractDeviceDetail(response);
        if (device) {
          enriched.device = device.deviceId || enriched.device;
          enriched.ipAddress = device.ipAddress || enriched.ipAddress;
          enriched.deviceFamily = device.deviceFamily || enriched.deviceFamily;
          enriched.buildId = device.buildId || enriched.buildId;
          enriched.buildVersion =
            device.softwareVersion || enriched.buildVersion;

          enriched.deviceStatus = device.state || enriched.deviceStatus;
          enriched.deviceController =
            device.controllerId || enriched.deviceController;
        }
      } catch {
        // Keep base alert payload when detail API fails.
      }
    }

    yield put(fetchAlertDetailSuccess(enriched));
  } catch (error) {
    if (error instanceof Error) {
      yield put(
        fetchAlertDetailFailure(
          error.message || 'Failed to load alert details',
        ),
      );
    } else {
      yield put(fetchAlertDetailFailure('Failed to load alert details'));
    }
  }
}

export function* watchAlerts() {
  yield takeLatest(fetchAlertRequest.type, fetchAlertsSaga);
  yield takeLatest(readAlertRequest.type, markReadAlertsSaga);
  yield takeLatest(markAllAsReadRequest.type, markAllasReadAlertsSaga);
  yield takeLatest(fetchAlertDetailRequest.type, fetchAlertDetailSaga);
}

export default watchAlerts;
