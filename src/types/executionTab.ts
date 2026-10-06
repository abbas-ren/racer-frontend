// Frontend types corresponding to backend ExecutionTab APIs

import { TabExecution } from 'store/slices/testExecution/types';

// Selection rules shape from backend
export interface ExecSelectionRules {
  mode: 'ALL' | 'PARTIAL';
  include: {
    suites: number[];
    cases: Record<number, number[]>;
  };
  exclude: {
    suites: number[];
    cases: Record<number, number[]>;
  };
}

// Execution tab entity returned by backend
export interface ExecutionTab {
  tabId: string;
  tabTitle: string | null;
  deviceFamily: string | null;
  deviceType: string | null;
  buildId: string | null;
  testPlanId: string | null;
  testExecutionId: string | null;
  testExecution: TabExecution | null;
  userId: string;
  selectionRules: ExecSelectionRules;
  createdAt?: Date;
  updatedAt?: Date;
}

// API response wrappers
export interface CreateExecutionTabResponse {
  success: boolean;
  data: ExecutionTab;
  tabId: string;
}

export interface GetExecutionTabsResponse {
  success: boolean;
  data: ExecutionTab[];
}

export interface GetExecutionTabByIdResponse {
  success: boolean;
  data: ExecutionTab;
}

export interface UpdateExecutionTabFieldResponse {
  success: boolean;
  data: ExecutionTab;
}

export interface UpdateExecutionTabSelectionRulesResponse {
  success: boolean;
  data: ExecutionTab;
}

export interface DeleteExecutionTabResponse {
  success: boolean;
  message: string;
}
