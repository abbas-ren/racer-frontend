export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(
  /\/+$/,
  '',
);
export const WEBSOCKET_BASE_URL =
  import.meta.env.VITE_WEBSOCKET_BASE_URL.replace(/\/+$/, '');
export const SOCKET_IO_BASE_URL =
  import.meta.env.VITE_SOCKET_IO_BASE_URL.replace(/\/+$/, '');
export const FARM_CONTROLLER_HOST = new URL(API_BASE_URL).hostname;

export const buildWebSocketUrl = (params: Record<string, string>) => {
  const url = new URL(WEBSOCKET_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
};

export const MODE = import.meta.env.MODE;
export const BASE_PORT = import.meta.env.BASE_PORT;
export const TEST_RAIL_VIEW_URL = import.meta.env.VITE_TEST_RAIL_VIEW_URL || '';
export const GITLAB_FILE_PATH = import.meta.env.VITE_GITLAB_FILE_PATH || '';
export const TEST_RESULTS_BASE_URL =
  import.meta.env.VITE_TEST_RESULTS_BASE_URL || 'http://localhost:8080';
