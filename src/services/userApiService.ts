import { FetchDataQuery, UsersResponse } from 'store';
import axiosInstance from '../AxiosConfig';
import { UserRequestAction } from 'utils/common';

interface PayloadUserRequestAction {
  userId: string;
  action: UserRequestAction;
}

export const fetchUsersApi = async (
  query: FetchDataQuery,
): Promise<UsersResponse> => {
  const response = await axiosInstance.get<UsersResponse>('auth/users', {
    params: query,
  });
  return response.data;
};

export const actionUserRequestApi = async (
  payload: PayloadUserRequestAction,
): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(
    'auth/register/action',
    {
      userId: payload.userId,
      action: payload.action,
    },
  );
  return response.data;
};
export const deleteUserApi = async (payload: {
  userId: string;
}): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>(
    'auth/user/' + payload.userId,
  );
  return response.data;
};
