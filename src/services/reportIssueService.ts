import axiosInstance from '../AxiosConfig';

export interface ReportIssuePayload {
  deviceFamily: string;
  deviceType: string;
  releaseId: string;
  description: string;
  file: File | null;
  attachLogs?: boolean;
  testExecutionId?: string | null;
}

export interface FaultyReportDetail {
  id: string;
  releaseId: string;
  deviceType: string;
  deviceFamily: string;
  lastTestExecutionId?: string | null;
  description: string;
  filePath?: string | null;
  logsPath?: string | null;
  status: string;
  createdBy: string;
  buildVersion?: string;
  reporterName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FaultyReportUser {
  id: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
}

interface FaultyReportByIdResponse {
  report: FaultyReportDetail;
  buildVersion?: string;
  user?: FaultyReportUser;
}

interface DownloadedFile {
  blob: Blob;
  fileName: string;
}

const parseContentDispositionFileName = (value?: string) => {
  if (!value) return undefined;
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = value.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1];
};

const fetchDownloadedFile = async (
  endpoint: string,
  fallbackName: string,
): Promise<DownloadedFile> => {
  const response = await axiosInstance.get<Blob>(endpoint, {
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'];
  const fileName =
    parseContentDispositionFileName(contentDisposition) || fallbackName;

  return {
    blob: response.data,
    fileName,
  };
};

// Submit a build issue report. Uses multipart/form-data when file is present.
export async function submitReportIssue(
  payload: ReportIssuePayload,
): Promise<void> {
  const form = new FormData();
  form.append('deviceFamily', payload.deviceFamily);
  form.append('deviceType', payload.deviceType);
  form.append('releaseId', payload.releaseId);
  form.append('description', payload.description);
  if (payload.attachLogs !== undefined) {
    form.append('attachLogs', String(payload.attachLogs));
  }
  if (payload.testExecutionId) {
    form.append('testExecutionId', payload.testExecutionId);
  }
  if (payload.file) {
    form.append('image', payload.file, payload.file.name);
  }

  await axiosInstance.post('device/faulty/report', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function fetchFaultyReportById(
  reportId: string,
): Promise<FaultyReportDetail> {
  const response = await axiosInstance.get<
    FaultyReportDetail | FaultyReportByIdResponse
  >(`device/faulty/report/${reportId}`);

  const data = response.data;
  if ('report' in data) {
    const fullName =
      `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim();
    return {
      ...data.report,
      buildVersion: data.buildVersion,
      createdBy: data.report.createdBy || data.user?.id || '',
      reporterName: fullName || data.user?.userName,
    };
  }

  return data;
}

export async function downloadFaultyReportAttachment(
  reportId: string,
): Promise<DownloadedFile> {
  return fetchDownloadedFile(
    `device/faulty/report/${reportId}/file`,
    `faulty-report-${reportId}.bin`,
  );
}

export async function downloadFaultyReportLogs(
  reportId: string,
): Promise<DownloadedFile> {
  return fetchDownloadedFile(
    `device/faulty/report/${reportId}/logs`,
    `faulty-report-${reportId}-logs.txt`,
  );
}

export async function fetchFaultyReportLogsContent(
  reportId: string,
): Promise<string> {
  const downloaded = await downloadFaultyReportLogs(reportId);
  const content = await downloaded.blob.text();
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return '';
  }

  try {
    return `${JSON.stringify(JSON.parse(trimmedContent), null, 2)}\n`;
  } catch {
    return content;
  }
}

export default {
  submitReportIssue,
  fetchFaultyReportById,
  downloadFaultyReportAttachment,
  downloadFaultyReportLogs,
  fetchFaultyReportLogsContent,
};
