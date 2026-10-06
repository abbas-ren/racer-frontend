import {
  DeviceForUserResponse,
  DeviceResponse,
  DownloadFilters,
  FetchDataQuery,
} from 'store';
import axiosInstance from '../AxiosConfig';
import { DeviceStatus } from 'typesCustom/components';
import { DeviceDetail, IDevice } from 'typesCustom/types';
import { ReleaseAttributes } from 'typesCustom/tests';

export const fetchDeviceApi = async (
  query: FetchDataQuery,
): Promise<{ data: DeviceDetail }> => {
  const response = await axiosInstance.get<{ data: DeviceDetail }>('device/', {
    params: query,
  });
  return response?.data;
};

export const fetchDeviceDetailsApi = async (params: {
  deviceId: string;
}): Promise<DeviceResponse> => {
  const response = await axiosInstance.get<DeviceResponse>(
    `device/${params.deviceId}`,
  );
  return response.data;
};

export const fetchDevicesForUser = async (
  query: FetchDataQuery,
): Promise<DeviceForUserResponse> => {
  const response = await axiosInstance.get<DeviceForUserResponse>(
    'device/user',
    {
      params: query,
    },
  );
  return response.data;
};

export const updateDeviceStatusAPI = async ({
  status,
  deviceID,
}: {
  status: DeviceStatus;
  deviceID: string;
}): Promise<IDevice> => {
  const response = await axiosInstance.put(`device/${deviceID}/action`, {
    action: status,
  });
  return response.data;
};

export const deleteDeviceAPI = async (
  deviceID: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.delete(`device/${deviceID}`);
  return response.data;
};
export const saveHeartbeatTimeoutAPI = async ({
  deviceId,
  value,
}: {
  deviceId: string;
  value: number;
}): Promise<{ message: string }> => {
  const response = await axiosInstance.put(`device/heartbeat/timeout`, {
    deviceId,
    value,
  });
  return response.data;
};

export const downloadDevicesCSV = async (
  filters: DownloadFilters,
): Promise<Blob> => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined),
  );
  const response = await axiosInstance.get(`device/export?${params}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const fetchDeviceFamilies = async (): Promise<string[]> => {
  const response = await axiosInstance.get<string[]>('device/families');
  return response.data;
};

export const fetchDeviceTypes = async (
  deviceFamily: string,
): Promise<string[]> => {
  const response = await axiosInstance.get<string[]>('device/deviceTypes', {
    params: { deviceFamily },
  });
  return response.data;
};

export const fetchBuildsForDeviceType = async (
  deviceType: string,
): Promise<ReleaseAttributes[]> => {
  const response = await axiosInstance.get<ReleaseAttributes[]>(
    `device/builds`,
    {
      params: { deviceType },
    },
  );
  return response.data;
};

export const fetchBuildsForDevice = async (id: string): Promise<string[]> => {
  const response = await axiosInstance.get<string[]>(`device/${id}/builds`);
  return response.data;
};

export const fetchLastHeartbeatApi = async (
  deviceId: string,
): Promise<{
  success: boolean;
  data: { timestamp: string; data: any; timeout: number } | null;
}> => {
  const response = await axiosInstance.get<{
    success: boolean;
    data: { timestamp: string; data: any; timeout: number } | null;
  }>(`device/${deviceId}/heartbeat`);
  return response.data;
};

export const toggleDevicePowerAPI = async (
  deviceId: string,
): Promise<IDevice> => {
  const response = await axiosInstance.put<IDevice>(
    `device/relay/toggle/${deviceId}`,
  );
  return response.data;
};

export interface TopologyDevice {
  deviceId: string;
  deviceName: string | null;
  deviceType: string | null;
  deviceFamily: string | null;
  macAddress: string;
  ipAddress: string;
  state: string;
  status: string;
  controllerId: string | null;
  heartbeatTimer: number;
}

export const fetchDevicesForTopologyApi = async (): Promise<{
  success: boolean;
  data: TopologyDevice[];
}> => {
  const response = await axiosInstance.get<{
    success: boolean;
    data: TopologyDevice[];
  }>('device/topology');
  return response.data;
};

export const fetchDeviceDetailApi = async (
  deviceId: string,
): Promise<{ success: boolean; data: IDevice }> => {
  const response = await axiosInstance.get<{
    success: boolean;
    data: IDevice;
  }>(`device/${deviceId}`);
  return response.data;
};
