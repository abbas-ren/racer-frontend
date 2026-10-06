import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getSharedSocket } from 'services/socketIoClient';
import {
  setBulkHeartbeats,
  setHeartbeatTimer,
  setDeviceHeartbeatStatus,
  updateSidebarDeviceInterfaces,
} from 'store/slices';

interface InterfaceUpdatePayload {
  deviceId: string;
  changes: Array<{
    type: string;
    interfaceId: string | null;
    status: string;
  }>;
  heartbeatData: any;
  timestamp: string;
}

interface DevicePingPayload {
  deviceId: string;
  timestamp: string;
}

interface DeviceControllerPingPayload {
  controllerId: string;
  timestamp: string;
  metrics?: any;
}

/**
 * Joins the socket.io room `device:<deviceId>` when the sidebar opens.
 * Manages a local 1-second interval timer for the opened device only.
 * Listens for:
 *  - `device:ping` — resets the heartbeat timer to 0 for the opened device
 *  - `device:interface-update` — updates Redux heartbeat data with changed interface state
 * Leaves the room and stops the timer on unmount or when deviceId changes.
 */
export const useDeviceInterfaceSocket = (
  deviceId: string | null,
  userId?: string,
  targetType: 'device' | 'device_controller' = 'device',
) => {
  const dispatch = useDispatch();
  const prevDeviceId = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSharedSocket(userId);
    const roomEventPrefix =
      targetType === 'device_controller' ? 'device-controller' : 'device';

    // Leave previous room if device changed
    if (prevDeviceId.current && prevDeviceId.current !== deviceId) {
      socket.emit(`leave:${roomEventPrefix}`, prevDeviceId.current);
    }

    prevDeviceId.current = deviceId;

    if (!deviceId) {
      return;
    }

    // Join room for this device
    socket.emit(`join:${roomEventPrefix}`, deviceId);

    // Local 1-second interval timer — only for this device
    const timerInterval = setInterval(() => {
      dispatch(setHeartbeatTimer({ deviceId, value: null }));
    }, 1000);

    // Handle heartbeat ping — reset timer for this device
    const handlePing = (payload: DevicePingPayload) => {
      if (payload.deviceId !== deviceId) {
        return;
      }
      dispatch(setHeartbeatTimer({ deviceId, value: 0 }));
      dispatch(setDeviceHeartbeatStatus({ deviceId, status: true }));
    };

    const handleControllerPing = (payload: DeviceControllerPingPayload) => {
      if (payload.controllerId !== deviceId) {
        return;
      }

      dispatch(setHeartbeatTimer({ deviceId, value: 0 }));
      dispatch(setDeviceHeartbeatStatus({ deviceId, status: true }));

      if (payload.metrics) {
        dispatch(
          setBulkHeartbeats({
            [deviceId]: {
              type: 'heartbeat' as const,
              controllerId: deviceId,
              deviceControllerId: deviceId,
              timestamp: payload.timestamp,
              data: payload.metrics,
            },
          }),
        );
      }
    };

    // Handle interface changes — update sidebar device interfaces in Redux
    const handleInterfaceUpdate = (payload: InterfaceUpdatePayload) => {
      if (payload.deviceId !== deviceId) {
        return;
      }

      // Update sidebar device's interfaces directly
      dispatch(
        updateSidebarDeviceInterfaces({
          deviceId,
          changes: payload.changes,
        }),
      );

      if (payload.heartbeatData) {
        dispatch(
          setBulkHeartbeats({
            [deviceId]: {
              type: 'heartbeat' as const,
              deviceId,
              timestamp: payload.timestamp,
              data: payload.heartbeatData,
            },
          }),
        );
      }
    };

    if (targetType === 'device_controller') {
      socket.on('device_controller:ping', handleControllerPing);
    } else {
      socket.on('device:ping', handlePing);
      socket.on('device:interface-update', handleInterfaceUpdate);
    }

    return () => {
      clearInterval(timerInterval);
      if (targetType === 'device_controller') {
        socket.off('device_controller:ping', handleControllerPing);
      } else {
        socket.off('device:ping', handlePing);
        socket.off('device:interface-update', handleInterfaceUpdate);
      }
      socket.emit(`leave:${roomEventPrefix}`, deviceId);
    };
  }, [deviceId, dispatch, targetType, userId]);
};
