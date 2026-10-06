import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Alerts } from 'store/types/sagaTypes';
import type { AlertItem } from 'components/Dashboard/AdminDashboard/types';

interface AlertsState {
  data: Alerts[];
  loading: boolean;
  isFetched: boolean;
  error?: string | null;
  totalData: number;
  totalPages: number;
  currentPage: number;
  totalUnreadCount: number;
  selectedAlertDetail: AlertItem | null;
  alertDetailLoading: boolean;
  alertDetailError: string | null;
}

export interface FetchAlertsRequestPayload {
  page: number;
  limit?: number;
  from?: string;
  to?: string;
  append?: boolean;
}

const initialState: AlertsState = {
  data: [],
  loading: false,
  isFetched: false,
  error: null,
  totalData: 0,
  totalPages: 1,
  currentPage: 1,
  totalUnreadCount: 0,
  selectedAlertDetail: null,
  alertDetailLoading: false,
  alertDetailError: null,
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearAlertMessages: (state) => {
      state.error = null;
      state.loading = false;
    },

    fetchAlertRequest: (
      state,
      action: PayloadAction<FetchAlertsRequestPayload>,
    ) => {
      void action;
      state.loading = true;
      state.error = null;
    },
    fetchAlertSuccess: (
      state,
      action: PayloadAction<{
        data: Alerts[];
        totalPages: number;
        currentPage: number;
        totalData: number;
        totalUnreadCount?: number;
        append?: boolean;
      }>,
    ) => {
      state.loading = false;
      state.error = null;
      if (action.payload.append) {
        const existingById = new Map(state.data.map((item) => [item.id, item]));
        for (const nextAlert of action.payload.data) {
          existingById.set(nextAlert.id, nextAlert);
        }
        state.data = Array.from(existingById.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      } else {
        state.data = action.payload.data;
      }
      state.totalData = action.payload.totalData;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.totalUnreadCount =
        typeof action.payload.totalUnreadCount === 'number'
          ? action.payload.totalUnreadCount
          : action.payload.data.filter((alert) => !alert.isRead).length;
    },
    fetchAlertFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
      state.data = [];
      state.totalUnreadCount = 0;
    },
    readAlertRequest: (state, action: PayloadAction<string>) => {
      void action;
      state.loading = true;
      state.error = null;
    },
    readAlertSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = null;
      let unreadConsumed = false;
      state.data = state.data.map((alert) => {
        if (alert.id === action.payload) {
          unreadConsumed = !alert.isRead;
          return { ...alert, isRead: true, status: 'read', readAt: Date.now() };
        }
        return alert;
      });
      if (unreadConsumed) {
        state.totalUnreadCount = Math.max(0, state.totalUnreadCount - 1);
      }
    },
    readAlertFailure: (state, action: PayloadAction<string>) => {
      void action;
      state.loading = false;
    },
    markAllAsReadRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    markAllAsReadSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      void action;
      state.error = null;
      state.totalUnreadCount = 0;
      state.data = state.data.map((alert) => {
        return { ...alert, isRead: true, status: 'read', readAt: Date.now() };
      });
    },
    markAllAsReadFailure: (state, action: PayloadAction<string>) => {
      void action;
      state.loading = false;
    },
    addSingleAlert: (state, action: PayloadAction<Alerts>) => {
      const incoming = action.payload;
      const existingIndex = state.data.findIndex(
        (item) => item.id === incoming.id,
      );

      // Same alert can arrive via multiple socket subscribers (e.g. navbar + dashboard).
      // Keep a single row in state and merge latest payload.
      if (existingIndex >= 0) {
        const existing = state.data[existingIndex];
        const merged = { ...existing, ...incoming };
        state.data[existingIndex] = merged;
        if (existingIndex > 0) {
          state.data.splice(existingIndex, 1);
          state.data.unshift(merged);
        }
        return;
      }

      state.data.unshift(incoming);
      if (!incoming.isRead) {
        state.totalUnreadCount += 1;
      }
    },
    removeDeviceAlerts: (
      state,
      action: PayloadAction<{ deviceId: string }>,
    ) => {
      const { deviceId } = action.payload;
      state.data = state.data.filter(
        (alert) => alert.data?.deviceId !== deviceId,
      );
    },
    fetchAlertDetailRequest: (state, action: PayloadAction<AlertItem>) => {
      state.alertDetailLoading = true;
      state.alertDetailError = null;
      state.selectedAlertDetail = action.payload;
    },
    fetchAlertDetailSuccess: (state, action: PayloadAction<AlertItem>) => {
      state.alertDetailLoading = false;
      state.alertDetailError = null;
      state.selectedAlertDetail = action.payload;
    },
    fetchAlertDetailFailure: (state, action: PayloadAction<string>) => {
      state.alertDetailLoading = false;
      state.alertDetailError = action.payload;
    },
    clearAlertDetail: (state) => {
      state.selectedAlertDetail = null;
      state.alertDetailLoading = false;
      state.alertDetailError = null;
    },
  },
});

export const {
  clearAlertMessages,
  fetchAlertRequest,
  fetchAlertSuccess,
  fetchAlertFailure,
  readAlertFailure,
  readAlertRequest,
  readAlertSuccess,
  addSingleAlert,
  removeDeviceAlerts,
  markAllAsReadFailure,
  markAllAsReadRequest,
  markAllAsReadSuccess,
  fetchAlertDetailRequest,
  fetchAlertDetailSuccess,
  fetchAlertDetailFailure,
  clearAlertDetail,
} = alertsSlice.actions;

export default alertsSlice.reducer;
