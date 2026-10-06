import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  LoginApiResponse,
  RegisterActionPayload,
  RegisterApiResponse,
} from 'store/types/sagaTypes';
import { IUser } from 'typesCustom/types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: IUser | null;
  message: string | null;
  loading: boolean;
  error: string | null;
  resetForm: boolean;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  message: null,
  loading: false,
  error: null,
  resetForm: false,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear messages and errors
    clearAuthMessages: (state) => {
      state.message = null;
      state.error = null;
    },

    // Login actions
    loginRequest: (
      state,
      _action: PayloadAction<{ emailOrUsername: string; password: string }>,
    ) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    loginSuccess: (state, action: PayloadAction<LoginApiResponse>) => {
      state.loading = false;
      state.error = null;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      // state.message = action.payload.message;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.message = null;
    },

    // Forgot password actions
    forgotPasswordRequest: (
      state,
      _action: PayloadAction<{ emailOrUsername: string }>,
    ) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    forgotPasswordSuccess: (
      state,
      action: PayloadAction<{ message: string }>,
    ) => {
      state.loading = false;
      state.error = null;
      state.message = action.payload.message;
    },
    forgotPasswordFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },

    // Reset password actions
    resetPasswordRequest: (
      state,
      _action: PayloadAction<{
        password: string;
        userId: string;
        token: string;
      }>,
    ) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    resetPasswordSuccess: (
      state,
      action: PayloadAction<{ message: string }>,
    ) => {
      state.loading = false;
      state.error = null;
      state.message = action.payload.message;
    },
    resetPasswordFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },

    // Register actions
    registerRequest: (state, _action: PayloadAction<RegisterActionPayload>) => {
      state.loading = true;
      state.error = null;
      state.message = null;
    },
    registerSuccess: (state, action: PayloadAction<RegisterApiResponse>) => {
      state.loading = false;
      state.error = null;
      state.message = action.payload.message;
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.message = null;
    },

    // Logout action
    logout: (_state) => {
      return {
        ...initialState,
      };
    },

    resetAuth: () => initialState,

    startResetForm: (state) => {
      state.resetForm = true;
    },

    stopResetForm: (state) => {
      state.resetForm = false;
    },

    // Token refresh action
    refreshTokenSuccess: (
      state,
      action: PayloadAction<{ token: string; refreshToken?: string }>,
    ) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
    },

    // Restore auth state from storage (for app initialization)
    restoreAuthState: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken: string;
        user: IUser;
      }>,
    ) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    clearAuthMessage: (state) => {
      state.message = null;
    },
  },
});

export const {
  clearAuthMessages,
  loginRequest,
  loginSuccess,
  loginFailure,
  logout,
  registerRequest,
  registerSuccess,
  registerFailure,
  resetAuth,
  startResetForm,
  stopResetForm,
  forgotPasswordFailure,
  forgotPasswordRequest,
  forgotPasswordSuccess,
  resetPasswordFailure,
  resetPasswordRequest,
  resetPasswordSuccess,
  refreshTokenSuccess,
  restoreAuthState,
} = authSlice.actions;

export default authSlice.reducer;
