import { useEffect, useRef } from 'react';
import { useSocketIoEvent } from './useSocketIoEvent';
import { IDevice } from 'typesCustom/types';

type HeartbeatStatus = Record<string, number>;

interface HeartbeatPing {
  deviceId: string;
  timestamp: string;
}

export const useHeartbeatSocket = (
  onHeartbeat: (deviceId: string) => void,
  onDeviceTimeout: (deviceId: string) => void,
  timeoutMap: Record<string, number> = {},
  data: IDevice[],
) => {
  const lastSeen = useRef<HeartbeatStatus>({});

  useSocketIoEvent<HeartbeatPing>('heartbeat:ping', (message) => {
    const heartbeatId = message.deviceId;

    if (!heartbeatId) {
      return;
    }

    lastSeen.current[heartbeatId] = Date.now();
    onHeartbeat(heartbeatId);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.entries(lastSeen.current).forEach(([deviceId, last]) => {
        const deviceTimeout = timeoutMap[deviceId] ?? 30000;
        if (now - last > deviceTimeout) {
          onDeviceTimeout(deviceId);
          lastSeen.current[deviceId] = now + 999999;
        }
      });
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [timeoutMap, onHeartbeat, onDeviceTimeout, data]);
};
