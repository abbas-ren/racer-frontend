import axiosInstance from '../AxiosConfig';
import type {
  ControlAction,
  ControlContext,
  ControlSnapshot,
  JsonObject,
} from 'types/adminControl';

const params = (context: ControlContext) => ({
  source: context.source,
  controllerId: context.controllerId,
  deviceId: context.deviceId,
});

export const fetchAdminControl = async (
  context: ControlContext,
): Promise<ControlSnapshot> => {
  const response = await axiosInstance.get<ControlSnapshot>('admin/control', {
    params: params(context),
  });
  return response.data;
};

export const updateAdminControl = async (
  context: ControlContext,
  patch: JsonObject,
): Promise<ControlSnapshot> => {
  const response = await axiosInstance.patch<ControlSnapshot>(
    'admin/control',
    context.source === 'farmcontroller' ? { config: patch } : patch,
    { params: params(context) },
  );
  return response.data;
};

export const runAdminControlAction = async (
  context: ControlContext,
  action: ControlAction,
): Promise<unknown> => {
  const response = await axiosInstance.post(
    'admin/control',
    { action },
    { params: params(context) },
  );
  return response.data;
};
