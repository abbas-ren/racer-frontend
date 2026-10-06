import { call, put, takeLatest } from 'redux-saga/effects';
import type { FetchDataQuery, UsersResponse } from 'store/types/sagaTypes';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  actionUserRequest,
  actionUserRequestFailure,
  actionUserRequestSuccess,
  deleteUserFailure,
  deleteUserRequest,
  deleteUserSuccess,
  fetchUsersFailure,
  fetchUsersRequest,
  fetchUsersSuccess,
} from 'store/slices/user/userSlice';
import {
  actionUserRequestApi,
  deleteUserApi,
  fetchUsersApi,
} from 'services/userApiService';
import { UserRequestAction } from 'utils/common';
import { sleep } from 'radash';

function* fetchUsersSaga(
  action: PayloadAction<FetchDataQuery>,
): Generator<any, void, UsersResponse> {
  try {
    const response = yield call(fetchUsersApi, action.payload);
    yield put(fetchUsersSuccess(response));
  } catch (error: any) {
    yield put(
      fetchUsersFailure(
        error?.response?.data?.message || 'Something went wrong!',
      ),
    );
  }
}

function* actionUserRequestSaga(
  action: PayloadAction<{ userId: string; action: UserRequestAction }>,
): Generator<any, void, { message: string }> {
  try {
    console.log('[Saga] Processing actionUserRequest for', action.payload);
    const actionTaken = yield call(actionUserRequestApi, action.payload);
    yield sleep(3000);
    yield put(
      actionUserRequestSuccess({
        userId: action.payload.userId,
        action: action.payload.action,
        message: actionTaken.message,
      }),
    );
  } catch (error: any) {
    yield put(
      actionUserRequestFailure(
        error?.response?.data?.message || 'Something went wrong!',
      ),
    );
  }
}

function* deleteUser(
  action: PayloadAction<{ userId: string }>,
): Generator<any, void, UsersResponse> {
  try {
    yield call(deleteUserApi, action.payload);
    yield put(deleteUserSuccess({ userId: action.payload.userId }));
  } catch (error: any) {
    yield put(
      deleteUserFailure(
        error?.response?.data?.message || 'Something went wrong!',
      ),
    );
  }
}

export function* watchUsers() {
  // yield takeEvery("*", logActions);

  yield takeLatest(fetchUsersRequest.type, fetchUsersSaga);
  yield takeLatest(actionUserRequest.type, actionUserRequestSaga);
  yield takeLatest(deleteUserRequest.type, deleteUser);
}
export default watchUsers;
