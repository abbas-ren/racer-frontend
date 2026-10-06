import axiosInstance from '../AxiosConfig';
import type {
  AvailableRelayDevicesResponse,
  ConfigureRelayChannelPayload,
  ConfigureRelayChannelResponse,
  DeviceControllerListQuery,
  DeviceControllerListResponse,
  DeviceControllerRelay,
  RelayChannelItem,
  RelayDevicesQuery,
  RelayIdentityUpdatePayload,
  RelayIdentityUpdateResponse,
  UpdateDeviceControllerPayload,
  UpdateDeviceControllerResponse,
} from 'types/deviceController';

const BASE_URL_DEVICE = 'device/';
const BASE_URL_CONTROLLER = `${BASE_URL_DEVICE}controller`;
const BASE_URL_RELAY = `${BASE_URL_DEVICE}relay/`;

export const fetchAllDeviceControllers = async (
  query: DeviceControllerListQuery = {},
): Promise<DeviceControllerListResponse> => {
  const response = await axiosInstance.get<DeviceControllerListResponse>(
    BASE_URL_CONTROLLER,
    {
      params: query,
    },
  );

  return response.data;
};

export const updateDeviceController = async (
  controllerId: string,
  payload: UpdateDeviceControllerPayload,
): Promise<UpdateDeviceControllerResponse> => {
  const response = await axiosInstance.put<UpdateDeviceControllerResponse>(
    `${BASE_URL_CONTROLLER}/${encodeURIComponent(controllerId)}`,
    payload,
  );

  return response.data;
};

export const fetchRelaysByControllerId = async (
  controllerId: string,
): Promise<DeviceControllerRelay[]> => {
  const response = await axiosInstance.get<DeviceControllerRelay[]>(
    `${BASE_URL_RELAY}controller/${encodeURIComponent(controllerId)}`,
  );

  return response.data;
};

export const fetchRelayChannelsByRelayId = async (
  relayId: string,
): Promise<RelayChannelItem[]> => {
  const response = await axiosInstance.get<RelayChannelItem[]>(
    `${BASE_URL_RELAY}channels/relay/${encodeURIComponent(relayId)}`,
  );

  return response.data;
};

export const fetchAvailableDevicesForRelay = async (
  query: RelayDevicesQuery = {},
): Promise<AvailableRelayDevicesResponse> => {
  const response = await axiosInstance.get<AvailableRelayDevicesResponse>(
    `${BASE_URL_RELAY}devices/available`,
    {
      params: query,
    },
  );

  return response.data;
};

export const configureRelayChannels = async (
  payload: ConfigureRelayChannelPayload | ConfigureRelayChannelPayload[],
): Promise<ConfigureRelayChannelResponse> => {
  const response = await axiosInstance.post<ConfigureRelayChannelResponse>(
    `${BASE_URL_RELAY}configure`,
    payload,
  );

  return response.data;
};

export const updateRelayIdentity = async (
  relayId: string,
  payload: RelayIdentityUpdatePayload,
): Promise<RelayIdentityUpdateResponse> => {
  const response = await axiosInstance.put<RelayIdentityUpdateResponse>(
    `${BASE_URL_RELAY}${encodeURIComponent(relayId)}/identity`,
    payload,
  );

  return response.data;
};
