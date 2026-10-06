export type BuildScope = 'admin' | 'user';

export interface BuildUploadPayload {
  scope: BuildScope;
  file: File;
  metadata?: Record<string, string>;
}

export interface BuildUploadResult {
  uploadId?: string;
  location?: string;
}

export interface BuildState {
  uploading: boolean;
  progress: number; // 0 - 100
  error: string | null;
  lastResult?: BuildUploadResult | null;
  currentFileName?: string;
}

// ===== Builds listing types =====
export type BuildTypeEnum = 'OFFICIAL' | 'CUSTOM';

export interface BuildRelease {
  id: string;
  folderName: string;
  version: string;
  tag?: string;
  deviceType: string;
  deviceFamily: string;
  buildType: BuildTypeEnum;
  uploadedBy?: string;
  isFaulty?: boolean;
  status?: string;
  createdAt: string;
}

export interface BuildsFiltersResponse {
  deviceFamilies: string[];
  deviceTypes: string[];
}

export interface BuildsQuery {
  search?: string;
  deviceType?: string;
  deviceFamily?: string;
  flagged?: boolean;
  buildVersion?: string;
  page?: number; // 1-based page index for server
  limit?: number; // rows per page
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  silent?: boolean; // If true, fetch without showing loading state
}

export interface BuildsListState {
  // UI filters
  search: string;
  deviceType: string;
  deviceFamily: string;
  flagged: boolean | undefined;
  buildVersion: string;
  page: number;
  rowsPerPage: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';

  // Data
  data: BuildRelease[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  dataFetched: boolean;
  filters: BuildsFiltersResponse;
}

export interface BuildsListResponse {
  builds: BuildRelease[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  requestedCount: number;
}
