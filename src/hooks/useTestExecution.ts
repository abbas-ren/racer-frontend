import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  cancelTestExecutionRequest,
  RootState,
  testExecutionRequest,
} from 'store';
import { TestStatus } from 'typesCustom/tests';

export const useTestExecution = () => {
  const dispatch = useDispatch();
  const {
    selectedData,
    currentTestExecution,
    testPlans,
    selectedTestCases,
    selectedSuites,
    cancelled,
    selectMode,
  } = useSelector((state: RootState) => state.tests);
  const stopTest = useMemo(
    () =>
      currentTestExecution &&
      currentTestExecution?.status !== TestStatus.COMPLETED &&
      currentTestExecution?.status !== TestStatus.FAILED &&
      currentTestExecution?.status !== TestStatus.CANCELLED,
    [currentTestExecution],
  );

  const allSelectedTestCases = useMemo(
    () => Object.values(selectedTestCases).flat(),
    [selectedTestCases],
  );

  const enableStart = useMemo(() => {
    const allFilled = Object.values(selectedData).every(
      (v) => v !== '' && v !== null,
    );
    return (
      (allSelectedTestCases.length > 0 || selectedSuites.length > 0) &&
      allFilled
    );
  }, [allSelectedTestCases, selectedSuites, selectedData]);

  const handleStart = async () => {
    const testPlanName = testPlans[selectedData.buildID].items?.find(
      (item) => item.id === selectedData.testPlan,
    )?.name;
    const name = `${testPlanName} - ${dayjs().format('MMM D, YYYY h:mm A')} - ${selectedData.deviceID}:${selectedData.buildID} `;

    dispatch(
      testExecutionRequest({
        name: name,
        deviceId: selectedData.deviceID,
        buildId: selectedData.buildID,
        testCases: selectedTestCases,
        deviceFamily: selectedData.deviceFamily,
        testPlanId: selectedData.testPlan,
        testSuites: selectedSuites,
        testPlanName: testPlanName ?? '',
        isAllSelected: selectMode === 'all',
      }),
    );
  };

  const handleStop = useCallback(async () => {
    if (currentTestExecution?.testId) {
      dispatch(cancelTestExecutionRequest(currentTestExecution?.testId));
    }
  }, [dispatch, currentTestExecution?.testId]);

  const buttonDisabled = useMemo(
    () => (!enableStart && !stopTest) || cancelled.loading,
    [cancelled.loading, enableStart, stopTest],
  );

  return {
    handleStart,
    handleStop,
    enableStart,
    stopTest,
    buttonDisabled,
  };
};
