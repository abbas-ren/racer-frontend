import { useMemo } from 'react';
import { DeviceState } from 'typesCustom/components';
import { IDevice } from 'typesCustom/types';

const useDeviceStats = (devices: IDevice[]) => {
  return useMemo(() => {
    const { total, ...stats } = devices.reduce(
      (acc, device) => {
        if (device.status === 'approved') {
          acc.total++;
          switch (device.state) {
            case 'free':
              acc[DeviceState.AVAILABLE]++;
              break;
            case 'busy':
              acc[DeviceState.BUSY]++;
              break;
            case 'faulty':
              acc[DeviceState.FAULTY]++;
              break;
            case 'not_reachable':
              acc[DeviceState.NOT_REACHABLE]++;
              break;
          }
        }
        return acc;
      },
      {
        total: 0,
        [DeviceState.AVAILABLE]: 0,
        [DeviceState.BUSY]: 0,
        [DeviceState.FAULTY]: 0,
        [DeviceState.NOT_REACHABLE]: 0,
      },
    );

    return { total, stats };
  }, [devices]);
};

export default useDeviceStats;
