import {
  LoginApiResponse,
  RegisterActionPayload,
  RegisterApiResponse,
} from 'store';
import axiosInstance from '../AxiosConfig';

export const loginApi = async (credentials: {
  emailOrUsername: string;
  password: string;
}): Promise<LoginApiResponse> => {
  const response = await axiosInstance.post<LoginApiResponse>(
    'auth/signin',
    credentials,
  );
  return response.data;
};

export const registerApi = async (
  data: RegisterActionPayload,
): Promise<RegisterApiResponse> => {
  const response = await axiosInstance.post<RegisterApiResponse>(
    'auth/register/request',
    data,
  );
  return response.data;
};

export const registerApiByAdmin = async (
  data: RegisterActionPayload,
): Promise<RegisterApiResponse> => {
  const response = await axiosInstance.post<RegisterApiResponse>(
    'auth/register',
    data,
  );
  return response.data;
};

export const forgotPasswordApi = async (data: {
  emailOrUsername: string;
}): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(
    'auth/forgot-password',
    data,
  );
  return response.data;
};

export const resetPasswordApi = async (data: {
  password: string;
  userId: string;
  token: string;
}): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(
    'auth/reset-password',
    data,
  );
  return response.data;
};

export const validateTokenAndUser = async (token: string, userId: string) => {
  try {
    const response = await axiosInstance.post('/auth/verify-user', {
      token,
      userId,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};
