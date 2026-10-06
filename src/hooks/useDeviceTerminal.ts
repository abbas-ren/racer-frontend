import { useState, useCallback } from 'react';
import { IDevice } from 'typesCustom/types';

export type DeviceTerminalMode = 'ssh' | 'rtos';

export function useDeviceTerminal(devices: IDevice[]) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [terminalTarget, setTerminalTarget] = useState<string | null>(null);
  const [terminalMode, setTerminalMode] = useState<DeviceTerminalMode | null>(
    null,
  );

  const handleSshTerminalOpen = useCallback(
    (deviceId: string) => {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device && device.ipAddress) {
        setSelectedDeviceId(deviceId);
        setTerminalTarget(device.ipAddress);
        setTerminalMode('ssh');
      }
    },
    [devices],
  );

  const handleRtosTerminalOpen = useCallback(
    (deviceId: string) => {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        setSelectedDeviceId(deviceId);
        setTerminalTarget(device.ipAddress || null);
        setTerminalMode('rtos');
      }
    },
    [devices],
  );

  const closeTerminal = useCallback(() => {
    setTerminalTarget(null);
    setSelectedDeviceId(null);
    setTerminalMode(null);
  }, []);

  return {
    selectedDeviceId,
    terminalTarget,
    terminalMode,
    handleSshTerminalOpen,
    handleRtosTerminalOpen,
    closeTerminal,
  };
}
