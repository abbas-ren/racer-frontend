import { TestSuite } from 'typesCustom/tests';
import { TestDetails } from '../components/Tests';

export interface UseNewTestsExecutionReturn {
  testSuites: TestSuite[];
  expandedSuiteIds: string[];
  selectedTestId: string | null;
  testDetails: TestDetails | null;
  executionStatus: 'idle' | 'running' | 'completed';
  handleToggleSuite: (suiteId: string) => void;
  handleTestSelect: (testId: string) => void;
  handleRunTests: () => void;
  handleReportBuild: () => void;
}

function useNewTestsExecution(): UseNewTestsExecutionReturn {
  return {
    testSuites: [],
    expandedSuiteIds: [],
    selectedTestId: null,
    testDetails: null,
    executionStatus: 'idle',
    handleToggleSuite: () => void 0,
    handleTestSelect: () => void 0,
    handleRunTests: () => void 0,
    handleReportBuild: () => void 0,
  };
}

export default useNewTestsExecution;
