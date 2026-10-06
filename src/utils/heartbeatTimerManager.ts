type TimerMap = Record<string, NodeJS.Timeout>;
type DispatchFunction = (action: any) => void;

class HeartbeatTimerManager {
  private timers: TimerMap = {};
  private activeDevices = new Map<string, DispatchFunction>();
  private globalTimer: NodeJS.Timeout | null = null;
  private static instance: HeartbeatTimerManager | null = null;

  private constructor() {}

  static getInstance(): HeartbeatTimerManager {
    if (!HeartbeatTimerManager.instance) {
      HeartbeatTimerManager.instance = new HeartbeatTimerManager();
    }
    return HeartbeatTimerManager.instance;
  }

  private startGlobalTimer(): void {
    if (this.globalTimer || this.activeDevices.size === 0) return;

    this.globalTimer = setInterval(() => {
      if (this.activeDevices.size === 0) return;

      const dispatchGroups = new Map<DispatchFunction, string[]>();

      this.activeDevices.forEach((dispatch, deviceId) => {
        if (!dispatchGroups.has(dispatch)) {
          dispatchGroups.set(dispatch, []);
        }
        dispatchGroups.get(dispatch)!.push(deviceId);
      });

      dispatchGroups.forEach((deviceIds, dispatch) => {
        const deviceUpdates = deviceIds.map((deviceId) => ({
          deviceId,
          value: null,
        }));

        dispatch({
          type: 'heartbeat/batchUpdateTimers',
          payload: deviceUpdates,
        });
      });
    }, 1000);
  }

  private stopGlobalTimer(): void {
    if (this.globalTimer) {
      clearInterval(this.globalTimer);
      this.globalTimer = null;
    }
  }

  startHeartbeatTimer(deviceId: string, dispatch: DispatchFunction): void {
    if (this.activeDevices.has(deviceId)) {
      this.activeDevices.set(deviceId, dispatch);
      return;
    }

    this.activeDevices.set(deviceId, dispatch);

    if (this.activeDevices.size === 1) {
      this.startGlobalTimer();
    }
  }

  resetHeartbeatTimer(deviceId: string, dispatch: DispatchFunction): void {
    this.activeDevices.set(deviceId, dispatch);

    dispatch({
      type: 'heartbeat/setHeartbeatTimer',
      payload: { deviceId, value: 0 },
    });

    if (!this.globalTimer) {
      this.startGlobalTimer();
    }
  }

  stopHeartbeatTimer(deviceId: string): void {
    this.activeDevices.delete(deviceId);

    if (this.timers[deviceId]) {
      clearInterval(this.timers[deviceId]);
      delete this.timers[deviceId];
    }

    if (this.activeDevices.size === 0) {
      this.stopGlobalTimer();
    }
  }

  stopAllTimers(): void {
    this.activeDevices.clear();
    this.stopGlobalTimer();

    Object.values(this.timers).forEach(clearInterval);
    Object.keys(this.timers).forEach((key) => delete this.timers[key]);
  }

  getActiveDeviceCount(): number {
    return this.activeDevices.size;
  }

  getActiveDevices(): string[] {
    return Array.from(this.activeDevices.keys());
  }

  isTimerActive(): boolean {
    return this.globalTimer !== null;
  }

  static dispose(): void {
    if (HeartbeatTimerManager.instance) {
      HeartbeatTimerManager.instance.stopAllTimers();
      HeartbeatTimerManager.instance = null;
    }
  }
}

const heartbeatManager = HeartbeatTimerManager.getInstance();

export const startHeartbeatTimer = (
  deviceId: string,
  dispatch: DispatchFunction,
): void => {
  heartbeatManager.startHeartbeatTimer(deviceId, dispatch);
};

export const resetHeartbeatTimer = (
  deviceId: string,
  dispatch: DispatchFunction,
): void => {
  heartbeatManager.resetHeartbeatTimer(deviceId, dispatch);
};

export const stopHeartbeatTimer = (deviceId: string): void => {
  heartbeatManager.stopHeartbeatTimer(deviceId);
};

export const stopAllTimers = (): void => {
  heartbeatManager.stopAllTimers();
};

export const getActiveDeviceCount = (): number => {
  return heartbeatManager.getActiveDeviceCount();
};

export const getActiveDevices = (): string[] => {
  return heartbeatManager.getActiveDevices();
};

export const isTimerActive = (): boolean => {
  return heartbeatManager.isTimerActive();
};

export const disposeHeartbeatManager = (): void => {
  HeartbeatTimerManager.dispose();
};
