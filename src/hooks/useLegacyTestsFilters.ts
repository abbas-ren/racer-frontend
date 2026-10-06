import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import { setBuildID, setDeviceFamily, setDeviceID } from 'store/slices';

export interface FilterOption {
  value: string;
  label: string;
}

export interface UseLegacyTestsFiltersReturn {
  deviceFamily: string;
  device: string;
  build: string;
  testPlan: string;
  setDeviceFamily: (value: string) => void;
  setDevice: (value: string) => void;
  setBuild: (value: string) => void;
  setTestPlan: (value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function useLegacyTestsFilters(): UseLegacyTestsFiltersReturn {
  const dispatch = useDispatch();
  const { deviceFamily, deviceID, buildID } = useSelector(
    (state: RootState) => state.tests.selectedData,
  );

  // Old tests slice stores numeric plan elsewhere; keep placeholder string here for UI compatibility
  const testPlan = '';

  const setDeviceFamilyCb = useCallback(
    (value: string) => {
      dispatch(setDeviceFamily(value));
    },
    [dispatch],
  );

  const setDeviceCb = useCallback(
    (value: string) => {
      dispatch(setDeviceID(value));
    },
    [dispatch],
  );

  const setBuildCb = useCallback(
    (value: string) => {
      dispatch(setBuildID(value));
    },
    [dispatch],
  );

  const setTestPlanCb = useCallback((_value: string) => {
    // Intentionally left as no-op: legacy slice expects numeric planId
  }, []);

  const clearFilters = useCallback(() => {
    dispatch(setDeviceFamily(''));
    dispatch(setDeviceID(''));
    dispatch(setBuildID(''));
    // testPlan handled separately if needed
  }, [dispatch]);

  const hasActiveFilters = !!(deviceFamily || deviceID || buildID || testPlan);

  return {
    deviceFamily,
    device: deviceID,
    build: buildID,
    testPlan,
    setDeviceFamily: setDeviceFamilyCb,
    setDevice: setDeviceCb,
    setBuild: setBuildCb,
    setTestPlan: setTestPlanCb,
    clearFilters,
    hasActiveFilters,
  };
}

export default useLegacyTestsFilters;
