import {
  TestExecutionAnalyticsResponse,
  TestPlanSummary,
} from 'typesCustom/tests';
import axiosInstance from '../AxiosConfig';
import {
  DeviceStateDetailedAnalytics,
  DeviceStateAnalytics,
  DeviceUsageAnalyticsDaily,
  DeviceUsageAnalyticsQuery,
  DeviceUsageAnalyticsSummary,
  BuildPerformanceData,
  BuildsPerformanceResponse,
  UserBuildComparisonData,
  TestExecutionActivity,
  ExecutionDailySummary,
} from 'typesCustom/analytics';

const analyticsRoute = 'device/analytics';

export const fetchDeviceStateAnalytics =
  async (): Promise<DeviceStateAnalytics> => {
    const response = await axiosInstance.get<DeviceStateAnalytics>(
      `${analyticsRoute}/state`,
    );
    return response.data;
  };

export const fetchDeviceUsageAnalyticsDaily = async (
  query: DeviceUsageAnalyticsQuery,
): Promise<DeviceUsageAnalyticsDaily> => {
  const response = await axiosInstance.get<DeviceUsageAnalyticsDaily>(
    `${analyticsRoute}/usage/daily`,
    {
      params: query,
    },
  );
  return response.data;
};

export const fetchDeviceUsageAnalyticsSummary =
  async (): Promise<DeviceUsageAnalyticsSummary> => {
    const response = await axiosInstance.get<DeviceUsageAnalyticsSummary>(
      `${analyticsRoute}/usage/summary`,
    );
    return response.data;
  };

export const fetchTestPlanSummary = async (): Promise<TestPlanSummary> => {
  const response = await axiosInstance.get<TestPlanSummary>(
    `${analyticsRoute}/test/plan`,
  );
  return response.data;
};

export const getTestExecutionAnalytics = async (
  type: string,
): Promise<TestExecutionAnalyticsResponse> => {
  const response = await axiosInstance.get(`${analyticsRoute}/test/`, {
    params: {
      type,
    },
  });
  return response.data;
};

export const fetchDeviceStateDetailedAnalytics =
  async (): Promise<DeviceStateDetailedAnalytics> => {
    const response = await axiosInstance.get<DeviceStateDetailedAnalytics>(
      `${analyticsRoute}/state/detailed`,
    );
    return response.data;
  };

export const fetchBuildsPerformance = async (): Promise<
  Array<BuildPerformanceData>
> => {
  const response = await axiosInstance.get<
    BuildPerformanceData[] | BuildsPerformanceResponse
  >(`${analyticsRoute}/builds/performance`);

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data?.builds ?? [];
};

export const fetchBuildPerformanceById = async (
  buildId: string,
): Promise<BuildPerformanceData> => {
  const response = await axiosInstance.get(
    `${analyticsRoute}/builds/performance/${buildId}`,
  );
  console.log('Fetched build performance by ID:', response.data);
  return response.data;
};

export const fetchRecentTestExecutionsActivity = async (): Promise<
  TestExecutionActivity[]
> => {
  const response = await axiosInstance.get<TestExecutionActivity[]>(
    `${analyticsRoute}/execution`,
  );
  return response.data;
};

export const fetchRecentTestExecutionById = async (
  testId: string,
): Promise<TestExecutionActivity> => {
  const response = await axiosInstance.get<TestExecutionActivity>(
    `${analyticsRoute}/execution/${testId}`,
  );
  return response.data;
};

export const fetchRecentBuildsComparison = async (
  count: number = 3,
): Promise<UserBuildComparisonData[]> => {
  const response = await axiosInstance.get<UserBuildComparisonData[]>(
    `${analyticsRoute}/builds/comparison?count=${count}`,
  );
  return response.data;
};

export const fetchRecentBuildComparisonById = async (
  buildId: string,
): Promise<UserBuildComparisonData> => {
  const response = await axiosInstance.get<UserBuildComparisonData>(
    `${analyticsRoute}/builds/comparison/${buildId}`,
  );
  return response.data;
};

export const fetchExecutionStatusDailySummary = async (
  from: string,
  to: string,
): Promise<ExecutionDailySummary[]> => {
  const response = await axiosInstance.get<ExecutionDailySummary[]>(
    `${analyticsRoute}/execution/daily`,
    { params: { from, to } },
  );
  return response.data;
};
