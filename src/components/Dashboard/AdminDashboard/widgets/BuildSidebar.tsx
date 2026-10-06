import { Dispatch, SetStateAction, UIEvent, useEffect, useMemo } from 'react';
import { Box, CheckCircle2, Server, X, XCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearBuildExecutions,
  fetchBuildExecutionsRequest,
  RootState,
} from 'store/index';
import { BuildPerformanceItem, SidebarConfig } from '../types';
import { composeDashboardClasses } from '../styles/dashboardStyles';
import { Tooltip } from '@mui/material';

interface BuildSidebarProps {
  selectedBuild: BuildPerformanceItem | null;
  onClose: () => void;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  sidebarConfig: SidebarConfig | null;
}

const BuildSidebar = ({
  selectedBuild,
  onClose,
  activeTab,
  setActiveTab,
  sidebarConfig,
}: BuildSidebarProps) => {
  const PAGE_SIZE = 5;
  const dispatch = useDispatch();
  const executions = useSelector(
    (state: RootState) => state.dashboard.buildExecutions,
  );
  const isLoading = useSelector(
    (state: RootState) => state.dashboard.buildExecutionsLoading,
  );
  const fetchError = useSelector(
    (state: RootState) => state.dashboard.buildExecutionsError,
  );
  const buildExecutionsHasMore = useSelector(
    (state: RootState) => state.dashboard.buildExecutionsHasMore,
  );
  const buildsPerformance = useSelector(
    (state: RootState) => state.dashboard.buildsPerformance,
  );

  const normalizeCaseResult = (
    result?: string,
  ): 'passed' | 'failed' | 'other' => {
    const normalized = (result ?? '').trim().toUpperCase();

    if (
      normalized === 'PASS' ||
      normalized === 'PASSED' ||
      normalized === 'SUCCESS' ||
      normalized === 'SUCCEEDED' ||
      normalized === 'OK'
    ) {
      return 'passed';
    }

    if (
      normalized === 'FAIL' ||
      normalized === 'FAILED' ||
      normalized === 'ERROR'
    ) {
      return 'failed';
    }

    return 'other';
  };

  const formatExecutionStatus = (status: string) => {
    return status
      .split('_')
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
  };

  const formatSentenceCaseStatus = (status: string) => {
    return status
      .split('_')
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
  };

  const getExecutionStatusClassName = (status: string) => {
    const normalized = status.toLowerCase();

    if (normalized === 'completed') return 'available';
    if (normalized === 'cancelled' || normalized === 'failed') return 'busy';
    if (normalized === 'queued' || normalized === 'in_progress') return 'busy';

    return 'busy';
  };

  useEffect(() => {
    const buildId = selectedBuild?.buildId;

    if (!buildId) {
      dispatch(clearBuildExecutions());
      return;
    }

    dispatch(
      fetchBuildExecutionsRequest({
        buildId,
        limit: PAGE_SIZE,
        offset: 0,
        append: false,
      }),
    );
  }, [dispatch, selectedBuild?.buildId]);

  const handleSidebarScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!selectedBuild?.buildId || isLoading || !buildExecutionsHasMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const threshold = 80;
    const reachedBottom = scrollTop + clientHeight >= scrollHeight - threshold;

    if (!reachedBottom) {
      return;
    }

    dispatch(
      fetchBuildExecutionsRequest({
        buildId: selectedBuild.buildId,
        limit: PAGE_SIZE,
        offset: executions.length,
        append: true,
      }),
    );
  };

  const filterTabs = useMemo(() => {
    if (sidebarConfig?.filterTabs && sidebarConfig.filterTabs.length > 0) {
      return sidebarConfig.filterTabs;
    }

    return ['All Tests', 'Passed', 'Failed'];
  }, [sidebarConfig?.filterTabs]);

  useEffect(() => {
    if (!filterTabs.includes(activeTab) && filterTabs.length > 0) {
      setActiveTab(filterTabs[0]);
    }
  }, [activeTab, filterTabs, setActiveTab]);

  const loadedPageCounts = useMemo(() => {
    return executions.reduce(
      (acc, execution) => {
        const testCases = execution.testCases ?? [];
        testCases.forEach((testCase) => {
          const result = normalizeCaseResult(testCase.result);
          if (result === 'passed') acc.passed += 1;
          if (result === 'failed') acc.failed += 1;
          acc.total += 1;
        });
        return acc;
      },
      { total: 0, passed: 0, failed: 0 },
    );
  }, [executions]);

  const summaryCounts = useMemo(() => {
    const latestBuild = selectedBuild?.buildId
      ? buildsPerformance.find(
          (build) => build.buildId === selectedBuild.buildId,
        )
      : null;

    const passed =
      latestBuild?.passedTestCaseCount ??
      selectedBuild?.pass ??
      loadedPageCounts.passed;
    const failed =
      latestBuild?.failedTestCaseCount ??
      selectedBuild?.fail ??
      loadedPageCounts.failed;

    return {
      total: passed + failed,
      passed,
      failed,
    };
  }, [
    buildsPerformance,
    loadedPageCounts.failed,
    loadedPageCounts.passed,
    selectedBuild,
  ]);

  const executionCards = useMemo(() => {
    return executions
      .map((execution) => {
        const testCases = [...(execution.testCases ?? [])].sort(
          (left, right) => {
            const leftId = left.id ?? 0;
            const rightId = right.id ?? 0;
            return leftId - rightId;
          },
        );

        const filteredCases = testCases.filter((test) => {
          const result = normalizeCaseResult(test.result);
          if (activeTab === 'Passed') return result === 'passed';
          if (activeTab === 'Failed') return result === 'failed';
          return true;
        });
        const passedCount = testCases.filter(
          (test) => normalizeCaseResult(test.result) === 'passed',
        ).length;
        const failedCount = testCases.filter(
          (test) => normalizeCaseResult(test.result) === 'failed',
        ).length;
        const passRate =
          testCases.length > 0
            ? Math.round((passedCount / testCases.length) * 100)
            : 0;

        return {
          ...execution,
          filteredCases,
          passedCount,
          failedCount,
          passRate,
        };
      })
      .filter((execution) => execution.filteredCases.length > 0);
  }, [activeTab, executions]);

  if (!selectedBuild) return null;

  return (
    <div
      className={composeDashboardClasses('sidebar-backdrop')}
      onClick={onClose}
    >
      <div
        className={composeDashboardClasses('sidebar-container')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={composeDashboardClasses('sidebar-header')}>
          <div className={composeDashboardClasses('sidebar-header-left')}>
            <div className={composeDashboardClasses('sidebar-header-icon')}>
              <Box size={22} color="var(--mui-palette-secondary-main)" />
            </div>
            <div>
              <h2 className={composeDashboardClasses('card-title')}>
                {selectedBuild.version} - Test Cases
              </h2>
              <p className={composeDashboardClasses('test-subtitle')}>
                Test results across {executions.length} test executions
              </p>
            </div>
          </div>
          <button
            className={composeDashboardClasses('sidebar-close-btn')}
            onClick={onClose}
          >
            <X size={20} color="var(--mui-palette-text-secondary)" />
          </button>
        </div>

        <div className={composeDashboardClasses('sidebar-content')}>
          <div className={composeDashboardClasses('test-summary-stats')}>
            <div className={composeDashboardClasses('test-stat-box')}>
              <div className={composeDashboardClasses('test-stat-label')}>
                TOTAL TESTS
              </div>
              <div
                className={composeDashboardClasses('test-stat-value', 'total')}
              >
                {summaryCounts.total}
              </div>
            </div>
            <div className={composeDashboardClasses('test-stat-box')}>
              <div
                className={composeDashboardClasses('test-stat-label', 'passed')}
              >
                PASSED
              </div>
              <div
                className={composeDashboardClasses('test-stat-value', 'passed')}
              >
                {summaryCounts.passed}
              </div>
            </div>
            <div className={composeDashboardClasses('test-stat-box')}>
              <div
                className={composeDashboardClasses('test-stat-label', 'failed')}
              >
                FAILED
              </div>
              <div
                className={composeDashboardClasses('test-stat-value', 'failed')}
              >
                {summaryCounts.failed}
              </div>
            </div>
          </div>

          <div className={composeDashboardClasses('test-filters-wrapper')}>
            <span className={composeDashboardClasses('filter-label')}>
              Filter:
            </span>
            <div className={composeDashboardClasses('test-filter-tabs')}>
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  className={composeDashboardClasses(
                    'filter-pill',
                    activeTab === tab && 'active',
                  )}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'Passed' && (
                    <CheckCircle2
                      size={14}
                      color="var(--mui-palette-success-main)"
                    />
                  )}
                  {tab === 'Failed' && (
                    <XCircle size={14} color="var(--mui-palette-error-main)" />
                  )}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div
            className={composeDashboardClasses('test-devices-container')}
            onScroll={handleSidebarScroll}
          >
            {isLoading && executions.length === 0 && (
              <div className={composeDashboardClasses('alerts-empty-state')}>
                Loading test executions...
              </div>
            )}

            {!isLoading && executions.length === 0 && fetchError && (
              <div className={composeDashboardClasses('alerts-empty-state')}>
                {fetchError}
              </div>
            )}

            {!isLoading && executionCards.length === 0 && (
              <div className={composeDashboardClasses('alerts-empty-state')}>
                No test cases found for the selected filter
              </div>
            )}

            {executionCards.map((execution) => {
              const executionStatus = formatExecutionStatus(execution.status);
              const isPerfect = execution.failedCount === 0;

              return (
                <div
                  key={execution.testId || execution.id}
                  className={composeDashboardClasses('device-test-card')}
                >
                  <div
                    className={composeDashboardClasses('device-test-header')}
                  >
                    <div className={composeDashboardClasses('dth-top')}>
                      <div
                        className={composeDashboardClasses('dth-title-group')}
                      >
                        <Server
                          size={18}
                          color="var(--mui-palette-info-main)"
                          strokeWidth={2.5}
                        />
                        <span className={composeDashboardClasses('dth-tag')}>
                          {execution.testId || `Execution ${execution.id}`}
                        </span>
                        <span
                          className={composeDashboardClasses(
                            'dth-status',
                            getExecutionStatusClassName(execution.status),
                          )}
                        >
                          {executionStatus}
                        </span>
                      </div>
                      <div
                        className={composeDashboardClasses(
                          'dth-passrate',
                          isPerfect ? 'perfect' : 'warning',
                        )}
                      >
                        {execution.passRate}%
                      </div>
                    </div>
                    <div className={composeDashboardClasses('dth-bottom')}>
                      <span className={composeDashboardClasses('dth-id')}>
                        {execution.testPlanName || 'Unknown Test Plan'}
                      </span>
                      <span
                        className={composeDashboardClasses('dth-passed-text')}
                      >
                        {execution.passedCount} passed
                      </span>
                      {execution.failedCount > 0 && (
                        <span
                          className={composeDashboardClasses('dth-failed-text')}
                        >
                          {execution.failedCount} failed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={composeDashboardClasses('device-tests-list')}>
                    {execution.filteredCases.map((testCase) => {
                      const status = normalizeCaseResult(testCase.result);
                      const displayStatus = formatSentenceCaseStatus(
                        status === 'other' ? 'not_executed' : status,
                      );

                      return (
                        <div
                          key={`test-case-${testCase.testCaseId}`}
                          className={composeDashboardClasses('test-item-row')}
                        >
                          <div
                            className={composeDashboardClasses(
                              'test-check-icon',
                            )}
                          >
                            {status === 'passed' ? (
                              <CheckCircle2
                                size={16}
                                color="var(--mui-palette-success-main)"
                              />
                            ) : (
                              <XCircle
                                size={16}
                                color="var(--mui-palette-error-main)"
                              />
                            )}
                          </div>
                          <Tooltip
                            title={
                              testCase.title ||
                              `Test Case ${testCase.testCaseId}`
                            }
                            arrow
                            disableHoverListener={
                              (testCase.title || '').length <= 18
                            }
                          >
                            <span
                              className={composeDashboardClasses(
                                'test-item-name',
                              )}
                            >
                              {testCase.title ||
                                `Test Case ${testCase.testCaseId}`}
                            </span>
                          </Tooltip>
                          <span
                            className={composeDashboardClasses(
                              'test-item-duration',
                            )}
                          >
                            -
                          </span>
                          <span
                            className={composeDashboardClasses(
                              'test-item-badge',
                              status === 'passed'
                                ? 'badge-passed'
                                : 'badge-failed',
                            )}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {isLoading && executions.length > 0 && (
              <div className={composeDashboardClasses('alerts-empty-state')}>
                Loading more test executions...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildSidebar;
