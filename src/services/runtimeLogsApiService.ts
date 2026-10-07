import axiosInstance from '../AxiosConfig';
import type {
  RuntimeLogLevel,
  RuntimeLogRequestContext,
  RuntimeLogsResponse,
} from 'types/runtimeLogs';

export const fetchRuntimeLogs = async (
  context: RuntimeLogRequestContext,
  limit = 1000,
): Promise<RuntimeLogsResponse> => {
  const response = await axiosInstance.get<RuntimeLogsResponse>(
    'operations/logs',
    {
      params: {
        source: context.source,
        controllerId: context.controllerId,
        limit,
      },
    },
  );
  return response.data;
};

export const updateRuntimeLogLevel = async (
  context: RuntimeLogRequestContext,
  level: RuntimeLogLevel,
): Promise<string> => {
  const response = await axiosInstance.put<{ level: string }>(
    'operations/logs/level',
    {
      source: context.source,
      controllerId: context.controllerId,
      level,
    },
  );
  return response.data.level;
};
