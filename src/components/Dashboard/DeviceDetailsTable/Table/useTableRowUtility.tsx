import { useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { DeviceState, DeviceStatus } from 'typesCustom/components';
import { IDevice } from 'typesCustom/types';
import { capitalize } from 'radash';
import { getDeviceStateColor } from 'utils/dashboard';
import { useDispatch } from 'react-redux';
import {
  clearDeviceMessage,
  deleteDeviceRequest,
  heartbeatTimeoutRequest,
  removeDeviceAlerts,
  updateDeviceStatusRequest,
  // updateSelectedDevice,
} from 'store/slices';
import { useEffect, useMemo, useRef } from 'react';
import toastService from 'services/ToastService';
import { USER_ACTION_LOADING } from 'constants/messagesConstants';
import { Id } from 'react-toastify';
import useDevice, { UseDeviceParams } from 'hooks/useDevice';
import { TestStatus } from 'typesCustom/tests';
import { STATE_LABEL } from 'constants/dashboard';
import { useAlertSocket } from 'hooks/useAlertSocket';
import { AlertData } from 'services/wsClient';

const HideForUnApproved = [
  // 'deviceId',
  'softwareVersion',
  'createdAt',
  'testResult',
  'availability',
  'usage',
];

function useTableRowUtility(paginationParams?: UseDeviceParams) {
  const theme = useTheme();

  const { loading, error, message, actionLoading, fetchPageData } =
    useDevice(paginationParams);
  const dispatch = useDispatch();
  const loadingToastIdRef = useRef<Id | null>(null);
  const lastMessageRef = useRef<string | null>(null);

  const STATE_COLOR = useMemo(
    () => ({
      Passed: theme.palette.success.main,
      Failed: theme.palette.error.main,
      'In Progress': theme.palette.info.main,
      Queued: theme.palette.warning.main,
      Cancelled: theme.palette.grey[600],
    }),
    [theme],
  );

  const getFormattedValue = (
    value: string,
    columnName: string,
    row: IDevice,
  ) => {
    if (row.status !== 'approved' && HideForUnApproved.includes(columnName)) {
      return 'NA';
    }

    switch (columnName) {
      case 'softwareVersion':
        return value && value !== '' ? value : 'Unknown';
      case 'createdAt':
        return dayjs(value).format('DD/MM/YYYY hh:mm:ss a');
      case 'status':
        return capitalize(value);
      case 'lastExecutionStatus':
        return STATE_LABEL[value as TestStatus] || 'NA';
      default:
        return value || 'NA';
    }
  };

  const getCellColor = (
    columnName: string,
    value: string | number,
    stateColor: string,
  ) => {
    if (columnName === 'lastExecutionStatus') {
      return STATE_COLOR[value as keyof typeof STATE_COLOR];
    }
    if (columnName === 'testResult') {
      const testResult = String(value).toLowerCase();

      return testResult === 'pass'
        ? 'success.main'
        : testResult === 'fail'
          ? 'error.main'
          : 'text.body';
    }

    if (columnName === 'availability' && value !== 'NA') {
      return stateColor;
    }

    return 'text.body';
  };

  const getStateColor = (status: DeviceState) => {
    return getDeviceStateColor({ type: status, theme });
  };

  const updateDeviceStatus = async (id: string, status: DeviceStatus) => {
    loadingToastIdRef.current = toastService.loading(USER_ACTION_LOADING);
    dispatch(
      updateDeviceStatusRequest({
        deviceID: id,
        status,
      }),
    );

    // working
    // if (requestedDevice > ROW_PER_PAGE) {
    //   fetchPageData(0);
    //   dispatch(updateSelectedDevice(null));
    // }
  };

  useAlertSocket((alert: AlertData) => {
    if (!alert?.subtype) return;
    switch (alert?.subtype) {
      case 'device-deletion':
        fetchPageData(1);
        break;

      default:
        break;
    }
  });

  const deleteDevice = async (id: string) => {
    dispatch(removeDeviceAlerts({ deviceId: id }));
    dispatch(deleteDeviceRequest(id));
  };
  const saveHeartbeatTimeout = async (id: string, value: number) => {
    dispatch(heartbeatTimeoutRequest({ deviceId: id, value }));
  };

  useEffect(() => {
    if (message && message !== lastMessageRef.current) {
      if (loadingToastIdRef.current) {
        toastService.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }
      const timeout = setTimeout(() => {
        toastService.success(message);
        lastMessageRef.current = message;
        dispatch(clearDeviceMessage());
      }, 160);

      return () => clearTimeout(timeout);
    }
  }, [message, dispatch]);

  useEffect(() => {
    if (error && error !== lastMessageRef.current) {
      if (loadingToastIdRef.current) {
        toastService.dismiss(loadingToastIdRef.current);
        loadingToastIdRef.current = null;
      }
      const timeout = setTimeout(() => {
        toastService.error(error);
        lastMessageRef.current = error;
        dispatch(clearDeviceMessage());
      }, 160);

      return () => clearTimeout(timeout);
    }
  }, [error, dispatch]);

  return {
    getFormattedValue,
    getCellColor,
    getStateColor,
    updateDeviceStatus,
    deleteDevice,
    loading,
    error,
    actionLoading,
    saveHeartbeatTimeout,
    STATE_COLOR,
    STATE_LABEL,
  };
}

export default useTableRowUtility;
