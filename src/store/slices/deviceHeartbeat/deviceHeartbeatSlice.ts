import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HeartbeatData } from 'services/wsClient';

interface DeviceHeartbeatState {
  heartbeats: Record<string, HeartbeatData>;
  heartbeatTimers: Record<string, number>;
  deviceHeartbeatStatus: Record<string, boolean>;
}

const initialState: DeviceHeartbeatState = {
  heartbeats: {},
  heartbeatTimers: {},
  deviceHeartbeatStatus: {},
};

const deviceHeartbeatSlice = createSlice({
  name: 'heartbeat',
  initialState,
  reducers: {
    setBulkHeartbeats: (
      state,
      action: PayloadAction<Record<string, HeartbeatData>>,
    ) => {
      for (const [deviceId, data] of Object.entries(action.payload)) {
        state.heartbeats[deviceId] = data;
      }
    },
    setHeartbeatTimer: (
      state,
      action: PayloadAction<{ deviceId: string; value: number | null }>,
    ) => {
      const { deviceId, value } = action.payload;
      const current =
        value !== null ? value : (state.heartbeatTimers[deviceId] || 0) + 1;
      state.heartbeatTimers[deviceId] = Math.min(current, 999);
    },
    setDeviceHeartbeatStatus: (
      state,
      action: PayloadAction<{ deviceId: string; status: boolean }>,
    ) => {
      state.deviceHeartbeatStatus[action.payload.deviceId] =
        action.payload.status;
    },
    seedHeartbeatFromBackend: (
      state,
      action: PayloadAction<{
        deviceId: string;
        elapsedSeconds: number;
        data: any;
        isAlive: boolean;
      }>,
    ) => {
      const { deviceId, elapsedSeconds, data, isAlive } = action.payload;
      state.heartbeatTimers[deviceId] = elapsedSeconds;
      state.deviceHeartbeatStatus[deviceId] = isAlive;
      if (data) {
        state.heartbeats[deviceId] = data;
      }
    },
    clearHeartbeats: (state) => {
      state.heartbeats = {};
      state.heartbeatTimers = {};
      state.deviceHeartbeatStatus = {};
    },
    removeHeartbeat: (state, action: PayloadAction<string>) => {
      delete state.heartbeats[action.payload];
      delete state.heartbeatTimers[action.payload];
      delete state.deviceHeartbeatStatus[action.payload];
    },
    batchUpdateTimers: (
      state,
      action: PayloadAction<{ deviceId: string; value: number | null }[]>,
    ) => {
      action.payload.forEach(({ deviceId, value }) => {
        const current =
          value !== null ? value : (state.heartbeatTimers[deviceId] || 0) + 1;
        state.heartbeatTimers[deviceId] = Math.min(current, 999);
      });
    },
    fetchLastHeartbeatRequest: (
      _state,
      _action: PayloadAction<{ deviceId: string; timeout: number }>,
    ) => {
      void _action;
    },
  },
});

export const {
  setBulkHeartbeats,
  setHeartbeatTimer,
  setDeviceHeartbeatStatus,
  seedHeartbeatFromBackend,
  clearHeartbeats,
  batchUpdateTimers,
  removeHeartbeat,
  fetchLastHeartbeatRequest,
} = deviceHeartbeatSlice.actions;

export default deviceHeartbeatSlice.reducer;
