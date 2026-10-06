import { TestsContainer } from 'components/Tests';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadTestExecutionRequest } from 'store/slices/testExecution/testExecutionsSlice';
import { useLocation } from 'react-router';

const Tests = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const queryTestId = queryParams.get('testId');

    // Keep localStorage fallback for older navigation paths
    const storedTestId = localStorage.getItem('activeTestId');
    const activeTestId = queryTestId || storedTestId;

    if (activeTestId) {
      dispatch(loadTestExecutionRequest({ testId: activeTestId }));
    }

    if (storedTestId) {
      localStorage.removeItem('activeTestId');
    }
  }, [dispatch, location.search]);

  return <TestsContainer />;
};

export default Tests;
