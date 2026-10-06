import {
  call,
  put,
  takeLatest,
  all,
  CallEffect,
  PutEffect,
} from 'redux-saga/effects';
import Cookie from 'js-cookie';
import {
  loginSuccess,
  loginFailure,
  logout,
  registerSuccess,
  registerFailure,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  forgotPasswordRequest,
  resetPasswordSuccess,
  resetPasswordFailure,
  resetPasswordRequest,
  loginRequest,
  registerRequest,
} from '../../slices/auth/authSlice';
import type {
  LoginAction,
  RegisterAction,
  LoginApiResponse,
  RegisterApiResponse,
} from 'store/types/sagaTypes';
import {
  forgotPasswordApi,
  loginApi,
  registerApi,
  registerApiByAdmin,
  resetPasswordApi,
} from 'services/authApiService';
import { PayloadAction } from '@reduxjs/toolkit';
import { addNewUserToState } from 'store/slices';
import { disconnectSharedSocket } from 'services/socketIoClient';

// Properly typed saga generators
function* loginSaga(
  action: LoginAction,
): Generator<CallEffect | PutEffect, void, LoginApiResponse> {
  try {
    const response: LoginApiResponse = yield call(loginApi, action.payload);

    // Store tokens in cookies upon successful login
    if (response.token) {
      Cookie.set('accessToken', response.token, {
        expires: 7,
        secure: import.meta.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }

    if (response.refreshToken) {
      Cookie.set('refreshToken', response.refreshToken, {
        expires: 30,
        secure: import.meta.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }

    yield put(
      loginSuccess({
        message: response.message,
        token: response.token,
        refreshToken: response.refreshToken,
        user: response.user,
      }),
    );
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Login failed. Please try again.';
    yield put(loginFailure(errorMessage));
  }
}

function* forgotPasswordSaga(
  action: PayloadAction<{ emailOrUsername: string }>,
): Generator<CallEffect | PutEffect, void, LoginApiResponse> {
  try {
    const response: LoginApiResponse = yield call(
      forgotPasswordApi,
      action.payload,
    );
    yield put(
      forgotPasswordSuccess({
        message: response.message || 'Password reset email sent successfully',
      }),
    );
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to send password reset email';
    yield put(forgotPasswordFailure(errorMessage));
  }
}

function* resetPasswordSaga(
  action: PayloadAction<{
    password: string;
    userId: string;
    token: string;
  }>,
): Generator<CallEffect | PutEffect, void, LoginApiResponse> {
  try {
    const response: LoginApiResponse = yield call(
      resetPasswordApi,
      action.payload,
    );
    yield put(
      resetPasswordSuccess({
        message: response.message || 'Password reset successful',
      }),
    );
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to reset password';
    yield put(resetPasswordFailure(errorMessage));
  }
}

function* registerSaga(
  action: RegisterAction,
): Generator<CallEffect | PutEffect, void, RegisterApiResponse> {
  try {
    let response: RegisterApiResponse;

    if (action.payload.isAdmin) {
      response = yield call(registerApiByAdmin, action.payload);
    } else {
      response = yield call(registerApi, action.payload);
    }

    yield put(
      registerSuccess({
        message: response.message || 'Registration successfull',
        data: response.data,
      }),
    );

    if (response.data?.userData) {
      yield put(addNewUserToState(response.data.userData));
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      'Registration failed. Please try again.';
    yield put(registerFailure(errorMessage));
  }
}

function handleLogout() {
  try {
    // Disconnect Socket.IO
    disconnectSharedSocket();

    // Clear cookies
    Cookie.remove('accessToken');
    Cookie.remove('refreshToken');

    // Clear any other stored auth data
    localStorage.removeItem('userPreferences');
    sessionStorage.clear();

    console.log('User logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    // Don't fail logout even if cookie removal fails
  }
}

// Root saga that watches all auth actions
function* authSaga() {
  yield all([
    takeLatest(loginRequest.type, loginSaga),
    takeLatest(registerRequest.type, registerSaga),
    takeLatest(forgotPasswordRequest.type, forgotPasswordSaga),
    takeLatest(resetPasswordRequest.type, resetPasswordSaga),
    takeLatest(logout.type, handleLogout),
  ]);
}

// Named export for individual watchers (backward compatibility)
export function* watchLogin() {
  yield takeLatest(loginRequest.type, loginSaga);
  yield takeLatest(registerRequest.type, registerSaga);
  yield takeLatest(forgotPasswordRequest.type, forgotPasswordSaga);
  yield takeLatest(resetPasswordRequest.type, resetPasswordSaga);
  yield takeLatest(logout.type, handleLogout);
}

export default authSaga;
