import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDeviceRequest,
  updateDeviceState,
  updateSelectedDevice,
} from 'store/slices';
import { RootState } from 'store/store';
import { DeviceStatus } from 'typesCustom/components';
import { IDevice } from 'typesCustom/types';
import { useAlertSocket } from './useAlertSocket';
import { AlertData } from 'services/wsClient';
import { ROW_PER_PAGE } from 'pages/Admin/Devices/Devices';

export interface UseDeviceParams {
  page?: number;
  limit?: number;
  screen?: string;
  isUser?: boolean;
  setCurrentPage?: React.Dispatch<React.SetStateAction<number>>;
}

const useDevice = ({
  page,
  limit,
  screen,
  isUser = false,
  setCurrentPage,
}: UseDeviceParams = {}) => {
  const dispatch = useDispatch();
  const {
    loading,
    error,
    data,
    currentPage,
    totalDevices,
    totalPages,
    dataFetched,
    message,
    actionLoading,
    deviceTimers,
    deviceTimeouts,
    deviceDetails,
    selectedDevice,
    requestedCount,
  } = useSelector((state: RootState) => state.device);

  const isPaginated =
    page !== undefined && limit !== undefined && screen !== undefined;
  const selectedDeviceRef = useRef(selectedDevice);

  useEffect(() => {
    if (page !== undefined && limit !== undefined && screen !== undefined) {
      dispatch(fetchDeviceRequest({ page, limit, screen }));
    } else if (!dataFetched && !isUser) {
      dispatch(fetchDeviceRequest({}));
    }
  }, [page, limit, screen, dataFetched, isUser, dispatch]);

  const fetchPageData = useCallback(
    (page: number, limit: number = 16, screen: string = 'deviceDetails') => {
      dispatch(fetchDeviceRequest({ page, limit, screen }));
    },
    [dispatch],
  );

  useAlertSocket((alert: AlertData) => {
    if (!alert?.subtype) return;
    switch (alert?.subtype) {
      case 'device-addition':
        dispatch(
          fetchDeviceRequest({
            page: 1,
            limit: ROW_PER_PAGE,
            screen: 'deviceDetails',
          }),
        );
        setCurrentPage?.(0);
        break;

      case 'device-state-change':
        if (alert.message) {
          dispatch(updateDeviceState(alert.message));
        }
        break;
      case 'device-approval':
        if (requestedCount >= ROW_PER_PAGE) {
          fetchPageData(0);
          dispatch(updateSelectedDevice(null));
        }
        break;

      default:
        break;
    }
  });

  const selectDevice = useCallback(
    (device: IDevice | null) => {
      if (selectedDeviceRef.current !== device) {
        selectedDeviceRef.current = device;
        dispatch(updateSelectedDevice(device));
      }
    },
    [dispatch],
  );

  const processedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return {
        requestedDevice: [],
        approvedDevice: [],
        allData: [],
      };
    }

    const toTimestamp = (d: IDevice) => new Date(d.createdAt).getTime();

    const requested = data
      .filter((d) => d.status === DeviceStatus.REQUESTED)
      .sort((a, b) => toTimestamp(b) - toTimestamp(a));

    const approved = data
      .filter((d) => d.status === DeviceStatus.APPROVED)
      .sort((a, b) => toTimestamp(b) - toTimestamp(a));

    return {
      requestedDevice: requested,
      approvedDevice: approved,
      allData: [...requested, ...approved],
      firstApprovedDevice: approved[0] || null,
    };
  }, [data]);

  useEffect(() => {
    if (
      isPaginated &&
      processedData.firstApprovedDevice &&
      requestedCount < ROW_PER_PAGE
    ) {
      selectDevice(processedData.firstApprovedDevice);
    } else if (!isPaginated && !Array.isArray(data)) {
      selectDevice(null);
    }
  }, [isPaginated, processedData.firstApprovedDevice, data, selectDevice]);

  return {
    requestedDevice: requestedCount,
    approvedDevice: processedData.approvedDevice,
    data: processedData.allData,
    currentPage,
    totalDevices,
    totalPages,
    loading,
    error,
    message,
    actionLoading,
    deviceTimers,
    deviceTimeouts,
    deviceDetails,
    selectedDevice,
    selectDevice,
    fetchPageData,
  };
};

export default useDevice;
