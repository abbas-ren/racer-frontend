import { useEffect } from 'react';
import { IDevice } from 'typesCustom/types';
import { useDispatch } from 'react-redux';
import {
  batchUpdateTimers,
  setDeviceHeartbeatStatus,
  setHeartbeatTimer,
} from 'store/slices';
import {
  startHeartbeatTimer,
  stopAllTimers,
} from 'utils/heartbeatTimerManager';

export const useDeviceTimerManager = (
  devices: IDevice[] | undefined,
  deviceTimers: Record<string, number>,
) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!devices) {
      stopAllTimers();
      return;
    }
    stopAllTimers();
    devices.forEach((device) => {
      const timers: { deviceId: string; value: number | null }[] =
        Object.entries(deviceTimers).map(([deviceId, value]) => ({
          deviceId,
          value,
        }));

      dispatch(
        setDeviceHeartbeatStatus({ deviceId: device.deviceId, status: false }),
      );

      dispatch(batchUpdateTimers(timers));

      const timer = deviceTimers[device.deviceId] ?? 0;

      dispatch(
        setHeartbeatTimer({
          deviceId: device.deviceId,
          value: timer || null,
        }),
      );

      startHeartbeatTimer(device.deviceId, dispatch);
    });

    // Cleanup function to stop timers when component unmounts or devices change
    return () => {
      stopAllTimers();
    };
  }, [devices, dispatch]); // Removed deviceTimers from dependencies to prevent unnecessary re-runs

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllTimers();
    };
  }, []);
};
