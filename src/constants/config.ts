export const API_BASE_URL = window.location.origin
  ? window.location.origin + '/api/v1'
  : import.meta.env.VITE_API_BASE_URL;
export const MODE = import.meta.env.MODE;
export const BASE_PORT = import.meta.env.BASE_PORT;
export const TEST_RAIL_VIEW_URL = import.meta.env.VITE_TEST_RAIL_VIEW_URL || '';
export const GITLAB_FILE_PATH = import.meta.env.VITE_GITLAB_FILE_PATH || '';
export const TEST_RESULTS_BASE_URL =
  import.meta.env.VITE_TEST_RESULTS_BASE_URL || 'http://localhost:8080';
