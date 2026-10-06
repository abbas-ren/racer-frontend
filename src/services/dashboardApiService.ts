import axiosInstance from '../AxiosConfig';
import type { DashboardTableRow } from 'components/UserDashboard/shared/testExecutionData';
import type { DashboardApiData } from 'types/userDashboard';

interface TestExecutionApiResponse {
  data: DashboardTableRow[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export const fetchDashboardData = async (
  page: number = 1,
  limit: number = 100,
  sortBy: string = 'createdAt',
  desc: boolean = true,
): Promise<DashboardApiData> => {
  const response = await axiosInstance.get<TestExecutionApiResponse>(
    'device/test/execution/',
    {
      params: {
        page,
        limit,
        sortBy,
        desc: desc ? 'true' : 'false',
      },
    },
  );

  return {
    executions: Array.isArray(response.data.data) ? response.data.data : [],
  };
};
