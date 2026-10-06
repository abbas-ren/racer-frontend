// src/redux/types.ts

import { IDevice, IUser } from 'typesCustom/types';

export interface LoginAction {
  type: string;
  payload: { emailOrUsername: string; password: string };
}
export interface RegisterAction {
  type: string;
  payload: RegisterActionPayload;
}

export interface RegisterActionPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  role?: 'user';
}

export interface LoginApiResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: IUser;
}
export interface RegisterApiResponse {
  message: string;
  data: {
    userData?: IUser;
    username: string;
  };
}

export interface FetchDataQuery {
  sortBy?: string;
  desc?: string;
  page?: string | number;
  limit?: string | number;
  search?: string;
  filterBy?: string;
  filter?: string;
  screen?: string;
  deviceFamily?: string;
  showAll?: string;
}

export interface DeviceResponse {
  data: IDevice[];
  totalPages: number;
  currentPage: number;
  totalDevices: number;
  requestedCount: number;
  replace?: boolean;
  deviceTimeouts: Record<string, number>;
  deviceTimers: Record<string, number>;
}

export interface DeviceForUserResponse {
  data: IDevice[];
  totalPages: number;
  currentPage: number;
  totalDevices: number;
}

export interface UsersResponse {
  requests: IUser[];
  users: IUser[];
  totalPages: number;
  currentPage: number;
  totalDevices: number;
}

export interface Alerts {
  id: string;
  userId: string;
  title: string;
  message: string;
  data: Record<string, string>;
  type: string;
  status: string;
  isRead: boolean;
  readAt: any;
  createdAt: string;
  updatedAt: string;
  buildId?: string | null;
  deviceId?: string | null;
  deviceControllerId?: string | null;
  faultyReportId?: string | null;
}
