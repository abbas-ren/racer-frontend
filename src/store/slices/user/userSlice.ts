import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { FetchDataQuery, UsersResponse } from 'store/types/sagaTypes';
import { IUser } from 'typesCustom/types';
import { UserRequestAction } from 'utils/common';

interface UserState {
  requests: IUser[];
  users: IUser[];
  totalPages: number;
  currentPage: number;
  totalDevices: number;
  loading: boolean;
  error: string | null;
  message: string | null;
  dataFetched: boolean;
  actionLoading: boolean;
}

const initialState: UserState = {
  requests: [],
  users: [],
  totalPages: 1,
  currentPage: 1,
  totalDevices: 0,
  loading: false,
  error: null,
  message: null,
  dataFetched: false,
  actionLoading: false,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    fetchUsersRequest: (state, _action: PayloadAction<FetchDataQuery>) => {
      void _action;
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (state, action: PayloadAction<UsersResponse>) => {
      const { users, requests, totalDevices, currentPage } = action.payload;
      const totalUsers = users.length + requests.length;

      state.loading = false;
      state.dataFetched = true;
      state.totalDevices = totalDevices;
      state.users = users;
      state.requests = requests;
      state.totalPages = Math.ceil(totalUsers / 10);
      state.currentPage = currentPage || 1;
    },

    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state = initialState;
    },
    actionUserRequest: (
      state,
      _action: PayloadAction<{ userId: string; action: UserRequestAction }>,
    ) => {
      void _action;
      state.error = null;
      state.message = null;
      state.actionLoading = true;
    },
    actionUserRequestSuccess: (
      state,
      action: PayloadAction<{
        userId: string;
        action: UserRequestAction;
        message: string;
      }>,
    ) => {
      state.actionLoading = false;
      state.message =
        action.payload.message ||
        `User has been ${action.payload.action === UserRequestAction.Accept ? action.payload.action + 'ed' : action.payload.action + 'd'}!`;
      if (action.payload.action === UserRequestAction.Decline) {
        state.requests = state.requests.filter(
          (req) => req.id !== action.payload.userId,
        );
      } else {
        const reqUser = state.requests.find(
          (user) => user.id === action.payload.userId,
        );

        if (reqUser) {
          const user: IUser = {
            ...reqUser,
            realmRoles: [...reqUser.realmRoles, 'user'],
          };
          state.users.push(user);
          state.requests = state.requests.filter(
            (user) => user.id !== action.payload.userId,
          );
        }
      }
    },
    actionUserRequestFailure: (state, action: PayloadAction<string>) => {
      state.actionLoading = false;
      state.error = action.payload;
      state.message = null;
    },
    deleteUserRequest: (
      state,
      _action: PayloadAction<{
        userId: string;
      }>,
    ) => {
      void _action;
      state.actionLoading = true;
      state.error = null;
      state.message = null;
    },
    deleteUserSuccess: (state, action: PayloadAction<{ userId: string }>) => {
      state.actionLoading = false;
      state.message = 'User has been removed!';
      state.users = state.users.filter(
        (user) => user.id !== action.payload.userId,
      );
    },
    deleteUserFailure: (state, action: PayloadAction<string>) => {
      state.actionLoading = false;
      state.error = action.payload;
      state.message = null;
    },
    addNewUserToState: (state, action: PayloadAction<IUser>) => {
      state.users.unshift(action.payload);
    },
    addUserRequest: (state, action: PayloadAction<IUser>) => {
      state.dataFetched = false;
      state.requests.unshift(action.payload);
    },
    clearUsersMessage: (state) => {
      state.message = null;
      state.error = null;
    },
  },
});

export const {
  fetchUsersFailure,
  fetchUsersRequest,
  fetchUsersSuccess,
  actionUserRequest,
  actionUserRequestFailure,
  actionUserRequestSuccess,
  deleteUserFailure,
  deleteUserRequest,
  deleteUserSuccess,
  addNewUserToState,
  addUserRequest,
  clearUsersMessage,
} = usersSlice.actions;

export default usersSlice.reducer;
