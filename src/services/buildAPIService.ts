import axiosInstance from '../AxiosConfig';
import type {
  BuildRelease,
  BuildsQuery,
  BuildsListResponse,
} from 'types/builds';

const BASE_URL = 'device/build';

export const fetchBuildFilters = async (): Promise<{
  deviceFamilies: string[];
  deviceTypes: string[];
}> => {
  const response = await axiosInstance.get(`${BASE_URL}/filters`);
  return response.data;
};

export const fetchBuilds = async (
  query: BuildsQuery,
): Promise<BuildsListResponse> => {
  const {
    search,
    deviceType,
    deviceFamily,
    flagged,
    buildVersion,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;
  const response = await axiosInstance.get(`${BASE_URL}`, {
    params: {
      search,
      deviceType,
      deviceFamily,
      flagged,
      buildVersion,
      page,
      limit,
      sortBy,
      sortOrder,
    },
  });
  return response.data as BuildsListResponse;
};

export const updateBuildFlag = async (id: string, isFaulty: boolean) => {
  const response = await axiosInstance.put(`${BASE_URL}/${id}/flag`, {
    isFaulty,
  });
  return response.data;
};

export const deleteBuild = async (id: string) => {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
};

// ===== Upload helpers =====
export const initUploadSession = async (
  fileCount: number = 1,
): Promise<{ uploadId: string }> => {
  const res = await axiosInstance.post(`${BASE_URL}/upload/init`, {
    fileCount,
  });
  return res.data as { uploadId: string };
};

export const checkReleaseExists = async (
  deviceType: string,
  buildVersion: string,
): Promise<boolean> => {
  const res = await axiosInstance.get(`${BASE_URL}`, {
    params: { deviceType, buildVersion, limit: 1 },
  });
  const data = res.data as BuildsListResponse;
  return (data.builds || []).some(
    (b) => b.deviceType === deviceType && b.version === buildVersion,
  );
};

export const fetchBuildById = async (id: string): Promise<BuildRelease> => {
  const res = await axiosInstance.get(`${BASE_URL}/${id}`);
  return res.data;
};

// Backward compatible alias
export const getBuildById = fetchBuildById;
