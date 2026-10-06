import axiosInstance from '../AxiosConfig';
import type { Alerts } from 'store/types/sagaTypes';

const BASE_URL = 'device/notification';

export interface AlertsListResponse {
  data: Alerts[];
  totalData: number;
  totalPages: number;
  currentPage: number;
  totalUnreadCount?: number;
}

export interface AllAlertsQuery {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

/** Admin-only: returns active/recent alerts filtered to known devices */
export const fetchAlertApi = async (query: {
  page: number;
  limit?: number;
}): Promise<AlertsListResponse> => {
  const response = await axiosInstance.get<AlertsListResponse>(
    `${BASE_URL}/alerts`,
    { params: query },
  );
  return response.data;
};

/** Returns all alerts with optional date-range filter */
export const fetchAllAlerts = async (
  query: AllAlertsQuery = {},
): Promise<AlertsListResponse> => {
  const response = await axiosInstance.get<AlertsListResponse>(
    `${BASE_URL}/alerts/all`,
    { params: query },
  );
  return response.data;
};

export interface FaultyReportDetail {
  id: string;
  releaseId: string;
  deviceType: string;
  deviceFamily: string;
  description: string;
  createdBy: string;
  status: string;
  filePath?: string | null;
  logsPath?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchFaultyReportById = async (
  id: string,
): Promise<FaultyReportDetail> => {
  const response = await axiosInstance.get<FaultyReportDetail>(
    `device/faulty/report/${id}`,
  );
  return response.data;
};

/** Mark a single alert as read (any authenticated user) */
export const markSingleAlertRead = async (id: string): Promise<void> => {
  await axiosInstance.put(`${BASE_URL}/alerts/${id}/read`);
};

/** Admin-only: mark a single alert as read (legacy route) */
export const markAlertRead = async (id: string): Promise<string> => {
  const response = await axiosInstance.put<string>(
    `${BASE_URL}/alerts/read/${id}`,
  );
  return response.data;
};

/** Admin-only: mark all alerts as read */
export const markAllasAlertRead = async (): Promise<string> => {
  const response = await axiosInstance.put<string>(
    `${BASE_URL}/alerts/all/read`,
  );
  return response.data;
};
