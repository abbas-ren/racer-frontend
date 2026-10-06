import { SidebarConfig } from '../types';

export type TestResult = {
  name: string;
  duration: string;
  status: 'passed' | 'failed';
};

const resolveTestStatus = (
  deviceIndex: number,
  testName: string,
  testIndex: number,
  sidebarConfig: SidebarConfig | null,
): 'passed' | 'failed' => {
  const statusRules = sidebarConfig?.statusRules;
  const firstDeviceFailedTests = statusRules?.firstDeviceFailedTests ?? [];
  const moduloFail = statusRules?.moduloFail;

  if (deviceIndex === 0 && firstDeviceFailedTests.includes(testName)) {
    return 'failed';
  }

  if (
    deviceIndex > 1 &&
    typeof moduloFail === 'number' &&
    moduloFail > 0 &&
    (deviceIndex + testIndex) % moduloFail === 0
  ) {
    return 'failed';
  }

  return 'passed';
};

const resolveTestDuration = (
  status: 'passed' | 'failed',
  deviceIndex: number,
  testIndex: number,
  sidebarConfig: SidebarConfig | null,
): string => {
  const durationRules = sidebarConfig?.durationRules;

  if (status === 'failed') {
    const failedBase = durationRules?.failed?.base;
    const failedStep = durationRules?.failed?.step;
    const failedMod = durationRules?.failed?.mod;

    if (
      typeof failedBase !== 'number' ||
      typeof failedStep !== 'number' ||
      typeof failedMod !== 'number' ||
      failedMod <= 0
    ) {
      return '-';
    }

    return (
      (failedBase + ((testIndex * failedStep) % failedMod)).toFixed(1) + 's'
    );
  }

  const passedBase = durationRules?.passed?.base;
  const passedFactor = durationRules?.passed?.factor;
  const passedMod = durationRules?.passed?.mod;

  if (
    typeof passedBase !== 'number' ||
    typeof passedFactor !== 'number' ||
    typeof passedMod !== 'number' ||
    passedMod <= 0
  ) {
    return '-';
  }

  return (
    (
      passedBase +
      ((testIndex * deviceIndex * passedFactor) % passedMod)
    ).toFixed(1) + 's'
  );
};

export const buildDeviceTests = (
  tests: string[],
  deviceIndex: number,
  sidebarConfig: SidebarConfig | null,
): TestResult[] => {
  return tests.map((testName, testIndex) => {
    const status = resolveTestStatus(
      deviceIndex,
      testName,
      testIndex,
      sidebarConfig,
    );

    return {
      name: testName,
      duration: resolveTestDuration(
        status,
        deviceIndex,
        testIndex,
        sidebarConfig,
      ),
      status,
    };
  });
};

export const filterTestsByTab = (
  tests: TestResult[],
  activeTab: string,
): TestResult[] => {
  return tests.filter((test) => {
    if (activeTab === 'All Tests') return true;
    if (activeTab === 'Passed') return test.status === 'passed';
    if (activeTab === 'Failed') return test.status === 'failed';
    return true;
  });
};
