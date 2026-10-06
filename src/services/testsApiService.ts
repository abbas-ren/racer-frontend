import {
  TestExecutionPayload,
  TestExecutionResponse,
  TestExecutionsForTableResponse,
  TestExecutionResultResponse,
  InProgressTestsList,
  TestsQuery,
  TestPlan,
  TestSuite,
  TestCase,
  TestPlansResponseType,
  TestExecutionPayloadNew,
  TestExecutionsByBuildResponse,
} from 'typesCustom/tests';
import { TestCaseEntryForLogs } from 'types/tests';
import axiosInstance from '../AxiosConfig';
import { FetchDataQuery } from 'store/index';

export const fetchTestPlanList = async (
  data: TestsQuery,
): Promise<TestPlan[]> => {
  const response = await axiosInstance.get('device/test/plan', {
    params: data,
  });
  return response.data;
};

export const fetchTestSuitesList = async (
  data: TestsQuery,
): Promise<TestSuite[]> => {
  const response = await axiosInstance.get('device/test/suite', {
    params: data,
  });
  console.log('fetchTestSuitesList response', response);
  return response.data;
};

export const fetchTestCasesList = async (
  data: TestsQuery,
): Promise<TestCase[]> => {
  const response = await axiosInstance.get('device/test/testcase', {
    params: data,
  });
  return response.data;
};

export const fetchAllTestCases = async (
  planId: number,
): Promise<TestPlansResponseType> => {
  const response = await axiosInstance.get(
    `device/test/plan/${planId}/testcase`,
  );
  return response.data;
};

export const testExecution = async (
  data: TestExecutionPayload,
): Promise<{ testId: string }> => {
  const response = await axiosInstance.post('device/test/execution', data);
  return response.data;
};

// Direct test execution without tabs - new format
export const testExecutionDirect = async (payload: {
  deviceFamily: string;
  deviceType: string;
  buildId: string;
  selection: {
    mode: 'ALL' | 'PARTIAL';
    planId: string;
    planName?: string;
    exclude?: {
      suites?: string[];
      casesBySuite?: Record<string, string[]>;
    };
    include?: {
      suites?: string[];
      casesBySuite?: Record<string, string[]>;
    };
  };
}): Promise<{ testId: string; testExecutionId?: string }> => {
  const response = await axiosInstance.post('device/test/execution', payload);
  return response.data;
};

export const testExecutionNew = async (
  data: TestExecutionPayloadNew,
): Promise<{ testId: string }> => {
  const response = await axiosInstance.post('device/test/execution', data);
  return response.data;
};

export const getTestExecution = async (
  testId: string,
): Promise<TestExecutionResponse> => {
  const response = await axiosInstance.get(`device/test/execution/${testId}`);
  return response.data;
};

export const getTestExecutionLatest =
  async (): Promise<TestExecutionResponse> => {
    const response = await axiosInstance.get(`device/test/execution/latest`);
    return response.data;
  };

export const getTestExecutionByDevice = async (
  deviceId: string,
): Promise<TestExecutionResponse> => {
  const response = await axiosInstance.get(
    `device/test/execution/device/${deviceId}`,
  );
  return response.data;
};

export const getInProgressTestExecutionList = async (): Promise<
  InProgressTestsList[]
> => {
  const response = await axiosInstance.get(
    'device/test/execution/progress/list',
  );
  return response.data;
};

export const getTestExecutionForTable = async (
  testId: string,
): Promise<TestExecutionResponse> => {
  const response = await axiosInstance.get(
    `device/test/execution/${testId}/?table=true`,
  );
  return response.data;
};

export const getTestExecutionResults = async (
  testId: string,
): Promise<TestExecutionResultResponse> => {
  const response = await axiosInstance.get(
    `device/test/execution/results/${testId}`,
  );
  return response.data;
};

export const fetchTestExecutions = async (
  query: FetchDataQuery,
): Promise<TestExecutionsForTableResponse> => {
  const response = await axiosInstance.get('device/test/execution', {
    params: query,
  });
  return response.data;
};

export const cancelTestExecution = async (
  testId: string,
): Promise<TestExecutionResponse> => {
  const response = await axiosInstance.put(`device/test/cancel/${testId}`);
  return response.data;
};

export const downloadTestExecutionCSV = async (): Promise<Blob> => {
  const response = await axiosInstance.get(`device/test/export`, {
    responseType: 'blob',
  });
  return response.data;
};

export const getTestCasesByExecutionId = async (
  executionId: string,
): Promise<TestCaseEntryForLogs[]> => {
  const response = await axiosInstance.get(
    `device/test/execution/cases/${executionId}`,
  );
  return response.data;
};

export const downloadTestLog = async (testId: string): Promise<Blob> => {
  const response = await axiosInstance.get(
    `device/test/execution/logs/${testId}`,
    {
      responseType: 'blob',
    },
  );
  return response.data;
};

export const fetchTestExecutionByBuild = async (
  buildId: string,
  params?: {
    limit?: number;
    offset?: number;
  },
): Promise<TestExecutionsByBuildResponse> => {
  const response = await axiosInstance.get(
    `device/test/execution/build/${buildId}`,
    {
      params,
    },
  );
  return response.data;
};

export const getSingleTestExecution = async (
  testId: string,
): Promise<TestExecutionResponse> => {
  const response = await axiosInstance.get(
    `device/test/execution/single/${testId}`,
  );
  return response.data;
};

export const getSingleTestCase = async (
  testCaseId: number,
): Promise<TestCaseEntryForLogs> => {
  const response = await axiosInstance.get(
    `device/test/testcase/${testCaseId}`,
  );
  return response.data;
};

export const generateExecutionReport = async (
  testId: string,
): Promise<{ id: string; status: string; testExecutionId: string }> => {
  const response = await axiosInstance.put(
    `device/test/execution/report/${testId}`,
  );
  return response.data;
};

export const uploadExecutionReport = async (
  testId: string,
): Promise<{ id: string; status: string }> => {
  const response = await axiosInstance.put(
    `device/test/execution/report/${testId}/upload`,
  );
  return response.data;
};

export const getExecutionReport = async (
  testId: string,
): Promise<{
  id: string;
  status: string;
  testExecutionId: string;
  uploadError?: string | null;
} | null> => {
  try {
    const response = await axiosInstance.get(
      `device/test/execution/report/${testId}`,
    );
    return response.data;
  } catch {
    return null;
  }
};

export const getExecutionReportHtml = async (
  testId: string,
): Promise<string> => {
  const response = await axiosInstance.get(
    `device/test/execution/report/${testId}/html`,
    { responseType: 'text' },
  );
  return response.data;
};
