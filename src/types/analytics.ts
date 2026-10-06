import { DeviceState } from './components';
import { TestStatus } from './tests';

export interface DeviceStateAnalytics {
  total: number;
  stateCount: Map<DeviceState, number>;
}

export interface DeviceUsageAnalyticsQuery {
  day?: string;
  deviceId?: string;
  deviceFamily?: string;
}

export interface DeviceUsageAnalyticsDaily {
  totalDevices: number;
  totalSeconds: number;
  states: Record<string, number>;
}

export interface DeviceUsageAnalyticsSummary {
  weekly: Array<
    DeviceUsageAnalyticsDaily & {
      weekStart: string;
      weekEnd: string;
    }
  >;
  monthly: Array<
    DeviceUsageAnalyticsDaily & {
      monthStart: string;
      monthEnd: string;
    }
  >;
}

export interface DeviceStateDetailedItem {
  deviceId: string;
  deviceType: string;
  state: DeviceState;
}

export type DeviceStateDetailedAnalytics = Record<
  string,
  DeviceStateDetailedItem[]
>;

export interface BuildPerformanceData {
  buildId: string;
  buildVersion: string | null;
  flagged: boolean;
  deviceType: string | null;
  status: string | null;
  lastTestExecutionId: string | null;
  passedTestCaseCount: number;
  failedTestCaseCount: number;
  passedTestCasePercentage: number;
  averageExecutionTime: number;
  uniqueDeviceCount: number;
  executionCount: number;
}

export interface UserBuildComparisonData {
  buildId: string;
  buildVersion: string | null;
  deviceType: string | null;
  averageDuration: number;
  totalTestCases: number;
  passedPercentage: number;
}

export interface TestExecutionActivity {
  testId: string;
  buildVersion: string;
  deviceType: string;
  status: TestStatus;
  testPlanName: string;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  totalTestCases: number;
}

export interface BuildsPerformanceResponse {
  builds: BuildPerformanceData[];
}

export interface ExecutionDailySummary {
  date: string;
  totalExecutions: number;
  passedTestCases: number;
  failedTestCases: number;
  totalDurationSeconds: number;
}
