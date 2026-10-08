import axiosInstance from '../AxiosConfig';
import {
  configureRelayChannels,
  fetchAllDeviceControllers,
  fetchAvailableDevicesForRelay,
  fetchRelaysByControllerId,
  updateDeviceController,
  updateRelayIdentity,
} from 'services/deviceControllerAPIService';
import type {
  DeviceControllerItem,
  DeviceControllerListQuery,
  DeviceControllerListResponse,
  DeviceControllerRelay,
  RelayIdentityUpdatePayload,
  RelayIdentityUpdateResponse,
} from 'types/deviceController';
import type {
  ConfigurationSummary,
  ChannelHardwareAssignment,
  ControllerRow,
  EditControllerForm,
  RelayDeviceOption,
  UartConfigurationRequest,
  UartConfigurationResult,
} from 'types/configuration';

interface FetchControllersParams {
  search?: string;
  status?: 'All' | 'Online' | 'Offline';
  page?: number;
  limit?: number;
}

interface SaveRelayConfigurationParams {
  controllerId: string;
  relayId: string;
  assignments: Record<number, string>;
  hardwareAssignments: Record<number, ChannelHardwareAssignment>;
  currentController?: ControllerRow;
}

interface FetchControllersResult {
  rows: ControllerRow[];
  hasMore: boolean;
  summary: ConfigurationSummary;
}

const mapControllerStatus = (state?: string): 'Online' | 'Offline' =>
  state === 'active' ? 'Online' : 'Offline';

const mapRelayStatus = (state?: string): 'Online' | 'Offline' =>
  state === 'connected' ? 'Online' : 'Offline';

const mapRelay = (
  relay: DeviceControllerRelay,
): ControllerRow['relays'][number] => {
  const relayChannels = relay.relayChannels ?? [];

  return {
    relayId: relay.id,
    serialNo: relay.serialNumber,
    vidPid:
      relay.vendorId && relay.productId
        ? `${relay.vendorId}:${relay.productId}`.toUpperCase()
        : undefined,
    channels: relayChannels.length,
    status: mapRelayStatus(
      typeof relay.state === 'string' ? relay.state : undefined,
    ),
    relayChannels: relayChannels.map((channel) => ({
      channelId: channel.id,
      channelNumber: channel.channelNumber,
      deviceId: channel.deviceId ?? undefined,
    })),
    channelAssignments: relayChannels.reduce<Record<number, string>>(
      (acc, channel) => {
        if (channel.deviceId) {
          acc[channel.channelNumber] = channel.deviceId;
        }
        return acc;
      },
      {},
    ),
  };
};

export const configureDeviceUart = async (
  payload: UartConfigurationRequest,
): Promise<UartConfigurationResult> => {
  const response = await axiosInstance.post<UartConfigurationResult>(
    'device/uart/configure',
    payload,
  );
  return response.data;
};

const mapController = (
  controller: DeviceControllerItem,
  relays: DeviceControllerRelay[],
): ControllerRow => {
  const mappedRelays = relays.map(mapRelay);

  return {
    controllerId: controller.deviceControllerId,
    controllerName: controller.name || controller.deviceControllerId,
    generation: controller.deviceFamily || 'Gen 4',
    ipAddress: controller.ipAddress,
    relaysOnline: mappedRelays.filter((relay) => relay.status === 'Online')
      .length,
    relaysTotal: mappedRelays.length,
    status: mapControllerStatus(controller.state),
    relays: mappedRelays,
    mappings: controller.mappings,
  };
};

export const fetchControllers = async (
  params?: FetchControllersParams,
): Promise<FetchControllersResult> => {
  const query: DeviceControllerListQuery = {
    search: params?.search,
    page: params?.page ?? 1,
    limit: params?.limit ?? 20,
  };

  if (params?.status === 'Online') {
    query.state = 'active';
  }
  if (params?.status === 'Offline') {
    query.state = 'not-reachable';
  }

  const response: DeviceControllerListResponse =
    await fetchAllDeviceControllers(query);
  const controllers = response.data ?? [];
  const rows = await Promise.all(
    controllers.map(async (controller) => {
      let relays = controller.relays ?? [];
      if (relays.length === 0) {
        try {
          relays = await fetchRelaysByControllerId(
            controller.deviceControllerId,
          );
        } catch {
          relays = controller.relays ?? [];
        }
      }
      return mapController(controller, relays);
    }),
  );

  return {
    rows,
    hasMore: response.currentPage < response.totalPages,
    summary: {
      controllers: {
        total: response.summary?.controllers?.total ?? 0,
        online: response.summary?.controllers?.active ?? 0,
        offline: response.summary?.controllers?.notReachable ?? 0,
      },
      relays: {
        total: response.summary?.relays?.total ?? 0,
        online: response.summary?.relays?.connected ?? 0,
        offline: response.summary?.relays?.disconnected ?? 0,
      },
    },
  };
};

export const updateController = async (
  payload: EditControllerForm,
): Promise<ControllerRow | null> => {
  if (!payload.controllerId || payload.controllerId.trim() === '') {
    return null;
  }

  const updated = await updateDeviceController(payload.controllerId, {
    name: payload.controllerName,
    ipAddress: payload.ipAddress,
    deviceFamily: payload.generation,
  });

  const controllerData = updated.data;
  const relays = await fetchRelaysByControllerId(
    controllerData.deviceControllerId,
  );
  return mapController(controllerData, relays);
};

export const deleteController = async (
  controllerId: string,
): Promise<boolean> => {
  if (!controllerId || controllerId.trim() === '') {
    return false;
  }

  await axiosInstance.delete(
    `device/controller/${encodeURIComponent(controllerId.trim())}`,
  );
  return true;
};

export const fetchRelayDeviceOptions = async (
  page = 1,
  limit = 10,
  relayId?: string,
): Promise<{ devices: RelayDeviceOption[]; hasMore: boolean }> => {
  const response = await fetchAvailableDevicesForRelay({
    page,
    limit,
    relayId,
  });
  const devices = (response.devices ?? []).map((device) => ({
    deviceId: device.deviceId,
    deviceType: device.deviceType,
    deviceFamily: device.deviceFamily,
    macAddress: device.macAddress,
  }));
  const hasMore = devices.length >= limit;
  return { devices, hasMore };
};

export const saveRelayConfiguration = async ({
  relayId,
  assignments,
  hardwareAssignments,
  currentController,
}: SaveRelayConfigurationParams): Promise<ControllerRow | null> => {
  if (!currentController) {
    return null;
  }

  const selectedRelay = currentController.relays.find(
    (relay) => relay.relayId === relayId,
  );
  if (!selectedRelay) {
    return null;
  }

  const payload = selectedRelay.relayChannels.map((channel) => ({
    relayId,
    channelId: channel.channelId,
    deviceId: assignments[channel.channelNumber] || '',
    gpio: hardwareAssignments[channel.channelNumber]?.gpio || '',
    gpioDefaultLevel:
      hardwareAssignments[channel.channelNumber]?.gpioDefaultLevel || 'LOW',
    relayDefaultLevel:
      hardwareAssignments[channel.channelNumber]?.relayDefaultLevel || 'LOW',
  }));

  await configureRelayChannels(payload);

  const refreshedControllers = await fetchControllers({
    search: currentController.controllerId,
  });
  return (
    refreshedControllers.rows.find(
      (c) => c.controllerId === currentController.controllerId,
    ) ?? null
  );
};

export const saveRelayIdentity = async (
  relayId: string,
  payload: RelayIdentityUpdatePayload,
): Promise<RelayIdentityUpdateResponse> =>
  updateRelayIdentity(relayId, payload);
