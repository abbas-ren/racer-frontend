import axios from 'axios';
import store, { clearPersistedState } from 'store';
import { API_BASE_URL } from 'constants/config';
import { logout } from 'store';

const skipAddingTokenEndpoints = [
  '/signin',
  '/reset-password',
  '/forgot-password',
  '/register/request',
  '/auth/verify-user',
];

const hasRedirectedToLogin = false;

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const isEndpointSkipped = (url?: string) => {
  if (!url) return false;
  const cleanUrl = url.startsWith(API_BASE_URL)
    ? url.replace(API_BASE_URL, '')
    : url;
  return skipAddingTokenEndpoints.some((endpoint) =>
    cleanUrl.includes(endpoint),
  );
};

// Check if current page is login with reset-password mode
const isOnLoginResetPasswordPage = () => {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  return pathname === '/login' && params.get('mode') === 'reset-password';
};

axiosInstance.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth.token;
  const refreshToken = state.auth.refreshToken;

  if (token && !isEndpointSkipped(config.url)) {
    config.headers.authorization = `Bearer ${token}`;
    config.headers.refreshtoken = `Bearer ${refreshToken}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url;

    if (
      error.response?.status === 401 &&
      !isEndpointSkipped(url) &&
      !isOnLoginResetPasswordPage() &&
      !hasRedirectedToLogin
    ) {
      // hasRedirectedToLogin = true;
      store.dispatch(logout());
      clearPersistedState();
      // const redirectUrl = `/login`;
      // window.location.replace(redirectUrl);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
