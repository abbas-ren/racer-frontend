import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ControllerRow } from 'types/configuration';
import type { IDevice } from 'types/types';
import { RootState } from 'store';

export interface TreeTopologyDataState {
  // Raw data sources
  controllers: ControllerRow[];
  devices: IDevice[];

  // Sidebar selected device detail (full, with interfaces)
  sidebarDevice: IDevice | null;
  sidebarDeviceLoading: boolean;

  // Association maps for quick lookups
  deviceToControllerMap: Record<string, string>; // deviceId → controllerId
  controllerToDevicesMap: Record<string, string[]>; // controllerId → deviceIds[]
  relayChannelToDeviceMap: Record<string, string>; // relayChannelId → deviceId
  relayIdToControllerMap: Record<string, string>; // relayId → controllerId

  // Metadata
  lastUpdated: number;
  associationsReady: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: TreeTopologyDataState = {
  controllers: [],
  devices: [],
  sidebarDevice: null,
  sidebarDeviceLoading: false,
  deviceToControllerMap: {},
  controllerToDevicesMap: {},
  relayChannelToDeviceMap: {},
  relayIdToControllerMap: {},
  lastUpdated: 0,
  associationsReady: false,
  loading: false,
  error: null,
};

const treeTopologyDataSlice = createSlice({
  name: 'treeTopologyData',
  initialState,
  reducers: {
    fetchTreeTopologyDataRequest: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchTreeTopologyDataSuccess: (
      state,
      action: PayloadAction<{
        controllers: ControllerRow[];
        devices: IDevice[];
      }>,
    ) => {
      state.controllers = action.payload.controllers;
      state.devices = action.payload.devices;
      state.loading = false;
      state.error = null;
      rebuildAssociations(state);
    },

    fetchTreeTopologyDataFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Set raw data sources
    setControllers: (state, action: PayloadAction<ControllerRow[]>) => {
      state.controllers = action.payload;
      state.loading = false;
      rebuildAssociations(state);
    },

    setDevices: (state, action: PayloadAction<IDevice[]>) => {
      state.devices = action.payload;
      rebuildAssociations(state);
    },

    // Build associations from controllers and devices
    buildAssociations: (state) => {
      rebuildAssociations(state);
    },

    // Clear all data
    clearTreeTopologyData: (state) => {
      state.controllers = [];
      state.devices = [];
      state.sidebarDevice = null;
      state.sidebarDeviceLoading = false;
      state.deviceToControllerMap = {};
      state.controllerToDevicesMap = {};
      state.relayChannelToDeviceMap = {};
      state.relayIdToControllerMap = {};
      state.associationsReady = false;
      state.error = null;
    },

    // Sidebar device detail actions
    fetchSidebarDeviceRequest: (
      state,
      _action: PayloadAction<{ deviceId: string }>,
    ) => {
      state.sidebarDeviceLoading = true;
    },

    fetchSidebarDeviceSuccess: (state, action: PayloadAction<IDevice>) => {
      state.sidebarDevice = action.payload;
      state.sidebarDeviceLoading = false;
    },

    fetchSidebarDeviceFailure: (state) => {
      state.sidebarDeviceLoading = false;
    },

    clearSidebarDevice: (state) => {
      state.sidebarDevice = null;
      state.sidebarDeviceLoading = false;
    },

    // Update interface statuses on the sidebar device from WebSocket event
    updateSidebarDeviceInterfaces: (
      state,
      action: PayloadAction<{
        deviceId: string;
        changes: Array<{
          type: string;
          interfaceId: string | null;
          status: string;
        }>;
      }>,
    ) => {
      if (
        !state.sidebarDevice ||
        state.sidebarDevice.deviceId !== action.payload.deviceId
      ) {
        return;
      }

      const { changes } = action.payload;
      const interfaces = state.sidebarDevice.interfaces;
      if (!interfaces) return;

      for (const change of changes) {
        if (change.interfaceId === null) {
          // Update all interfaces of this type
          interfaces.forEach((iface) => {
            if (iface.type === change.type) {
              iface.status = change.status;
            }
          });
        } else {
          const match = interfaces.find(
            (iface) =>
              iface.type === change.type &&
              iface.interfaceId === change.interfaceId,
          );
          if (match) {
            match.status = change.status;
          }
        }
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

/**
 * Rebuild all association maps from controllers and devices
 */
function rebuildAssociations(state: TreeTopologyDataState) {
  state.deviceToControllerMap = {};
  state.controllerToDevicesMap = {};
  state.relayChannelToDeviceMap = {};
  state.relayIdToControllerMap = {};

  // Build controller → devices map and relay mappings
  state.controllers.forEach((controller) => {
    const controllerDeviceIds = new Set<string>();

    // Map devices based on controllerId reference
    state.devices.forEach((device) => {
      if (device.controllerId) {
        const deviceControllerId = getDeviceControllerId(device);
        if (deviceControllerId === controller.controllerId) {
          state.deviceToControllerMap[device.deviceId] =
            controller.controllerId;
          controllerDeviceIds.add(device.deviceId);
        }
      }
    });

    // Build relay → controller map and relay channel → device map
    controller.relays?.forEach((relay) => {
      state.relayIdToControllerMap[relay.relayId] = controller.controllerId;

      relay.relayChannels?.forEach((channel) => {
        if (channel.deviceId) {
          state.relayChannelToDeviceMap[channel.channelId] = channel.deviceId;
          // Also add to device→controller map if not already present
          if (!state.deviceToControllerMap[channel.deviceId]) {
            state.deviceToControllerMap[channel.deviceId] =
              controller.controllerId;
            controllerDeviceIds.add(channel.deviceId);
          }
        }
      });
    });

    if (controllerDeviceIds.size > 0) {
      state.controllerToDevicesMap[controller.controllerId] =
        Array.from(controllerDeviceIds);
    }
  });

  state.associationsReady = true;
  state.lastUpdated = Date.now();
}

/**
 * Extract controller ID from device (handles both direct string and object references)
 */
function getDeviceControllerId(device: IDevice): string | null {
  if (!device.controllerId) {
    return null;
  }

  if (typeof device.controllerId === 'string') {
    return device.controllerId;
  }

  if (typeof device.controllerId === 'object' && 'id' in device.controllerId) {
    return String(device.controllerId.id);
  }

  return null;
}

// Selectors
export const selectTreeTopologyData = (
  state: RootState,
): TreeTopologyDataState => state.treeTopologyData;

export const selectControllers = (state: RootState): ControllerRow[] =>
  state.treeTopologyData.controllers;

export const selectDevices = (state: RootState): IDevice[] =>
  state.treeTopologyData.devices;

export const selectDeviceToControllerMap = (
  state: RootState,
): Record<string, string> => state.treeTopologyData.deviceToControllerMap;

export const selectControllerToDevicesMap = (
  state: RootState,
): Record<string, string[]> => state.treeTopologyData.controllerToDevicesMap;

export const selectRelayChannelToDeviceMap = (
  state: RootState,
): Record<string, string> => state.treeTopologyData.relayChannelToDeviceMap;

export const selectRelayIdToControllerMap = (
  state: RootState,
): Record<string, string> => state.treeTopologyData.relayIdToControllerMap;

export const selectAssociationsReady = (state: RootState): boolean =>
  state.treeTopologyData.associationsReady;

export const selectTreeTopologyDataLoading = (state: RootState): boolean =>
  state.treeTopologyData.loading;

export const selectTreeTopologyDataError = (state: RootState): string | null =>
  state.treeTopologyData.error;

export const selectSidebarDevice = (state: RootState): IDevice | null =>
  state.treeTopologyData.sidebarDevice;

export const selectSidebarDeviceLoading = (state: RootState): boolean =>
  state.treeTopologyData.sidebarDeviceLoading;

// Utility selector: Get all devices for a controller
export const selectDevicesForController =
  (controllerId: string) =>
  (state: RootState): IDevice[] => {
    const deviceIds =
      state.treeTopologyData.controllerToDevicesMap[controllerId] || [];
    return state.treeTopologyData.devices.filter((device) =>
      deviceIds.includes(device.deviceId),
    );
  };

// Utility selector: Get controller for a device
export const selectControllerForDevice =
  (deviceId: string) =>
  (state: RootState): ControllerRow | null => {
    const controllerId = state.treeTopologyData.deviceToControllerMap[deviceId];
    if (!controllerId) return null;
    return (
      state.treeTopologyData.controllers.find(
        (c) => c.controllerId === controllerId,
      ) || null
    );
  };

export const {
  fetchTreeTopologyDataRequest,
  fetchTreeTopologyDataSuccess,
  fetchTreeTopologyDataFailure,
  setControllers,
  setDevices,
  buildAssociations,
  clearTreeTopologyData,
  fetchSidebarDeviceRequest,
  fetchSidebarDeviceSuccess,
  fetchSidebarDeviceFailure,
  clearSidebarDevice,
  updateSidebarDeviceInterfaces,
  setLoading,
  setError,
} = treeTopologyDataSlice.actions;

export default treeTopologyDataSlice.reducer;
