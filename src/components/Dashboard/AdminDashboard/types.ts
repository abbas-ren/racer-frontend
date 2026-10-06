export interface DateRange {
  start: Date;
  end: Date;
}

export interface DeviceStatusItem {
  name: string;
  value: number;
  color?: string;
  percentage?: string;
}

export interface UsageDataItem {
  name: string;
  idle: number;
  utilized: number;
  devices: number;
}

export interface AlertItem {
  criticalDeviceStatus: any;
  id: number | string;
  status: string;
  severity: string;
  device: string;
  desc: string;
  time: string;
  date?: string;
  type?: string;
  deviceId?: string;
  buildId?: string;
  faultyReportId?: string;
  deviceControllerId?: string;
  testLogs?: string;
  attachmentName?: string;
  attachmentContent?: string;
  ipAddress?: string;
  buildVersion?: string;
  deviceFamily?: string;
  deviceType?: string;
  deviceController?: string;
  submittedBy?: string;
  filePath?: string;
  logsPath?: string;
  deviceStatus?: string;
  failedTests?: string | number;
  failureRate?: string;
  alertType?: string;
}

export interface BuildPerformanceItem {
  buildId: string;
  buildVersion?: string | null;
  flagged?: boolean;
  deviceType?: string | null;
  lastTestExecutionId?: string | null;
  version: string;
  status: string;
  devices: number;
  pass: number;
  fail: number;
  passPercent: number;
  tags?: string[];
}

export interface DeviceFamilyItem {
  generation: string;
  deviceCount: number;
  devices: Array<{
    deviceId: string;
    deviceType: string;
    state: string;
  }>;
}

export interface SidebarStatusRules {
  firstDeviceFailedTests?: string[];
  moduloFail?: number;
}

export interface SidebarDurationRules {
  failed?: {
    base?: number;
    step?: number;
    mod?: number;
  };
  passed?: {
    base?: number;
    factor?: number;
    mod?: number;
  };
}

export interface SidebarConfig {
  filterTabs?: string[];
  tests?: string[];
  deviceDefaults?: {
    count?: number;
    baseTagPrefix?: string;
    baseTagStart?: number;
    ipPrefix?: string;
    ipStart?: number;
    idSuffix?: string;
  };
  statusRules?: SidebarStatusRules;
  durationRules?: SidebarDurationRules;
}

export interface AlertModalConfig {
  defaultTestLogs?: string;
  defaults?: Record<string, string>;
  critical?: {
    [x: string]: any;
    alertType?: string;
    failureRate?: string;
    failureBarWidth?: string;
    recommendedActions?: string[];
  };
  warning?: {
    severity: string;
    deviceStatus: string | undefined;
    alertType?: string;
    failureRate?: string;
    failureBarWidth?: string;
    recommendedActions?: string[];
  };
  buildReport?: Record<string, string>;
  feedback?: Record<string, string>;
}

export interface DashboardPayload {
  deviceStatus: DeviceStatusItem[];
  monthlyUsage: UsageDataItem[];
  weeklyUsage: UsageDataItem[];
  alerts: AlertItem[];
  buildPerf: BuildPerformanceItem[];
  deviceFamilies: DeviceFamilyItem[];
  sidebarConfig: SidebarConfig | null;
  alertModalConfig: AlertModalConfig | null;
}

export interface SidebarDevice {
  tag: string;
  ip: string;
  id: string;
}
