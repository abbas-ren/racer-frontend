import { Box, Stack, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from 'store/store';
import { useMemo, useState } from 'react';
import { TestCaseEntry } from 'typesCustom/tests';
import { useTheme } from '@mui/material';
import { getDisplayDate } from 'utils/test';
import { NoData } from 'assets/index';
import TabBar from 'components/common/TabBar/TabBar';
import Logs from './Logs/Logs';
import { isEmpty } from 'radash';

const tabItems = [
  { label: 'Activity', value: 'activity' },
  { label: 'Logs', value: 'logs' },
];

function TestActivity() {
  const theme = useTheme();
  const [failedOnly, setFailedOnly] = useState(false);
  const [selectedTab, setSelectedTab] = useState('activity');

  const { selectTestExecutionLoading, selectedTestExecution } = useSelector(
    (state: RootState) => state.tests,
  );

  const testSuites = useMemo(() => {
    const record = selectedTestExecution?.testCases;
    if (!record) return null;
    const grouped: {
      [key: string]: {
        name: string;
        testCases: Omit<TestCaseEntry, 'suiteId' | 'suiteName'>[];
      };
    } = {};

    Object.entries(record).forEach(([suiteKey, cases]) => {
      if (!grouped[suiteKey]) {
        const suiteName = cases[0]?.suiteName ?? '';
        grouped[suiteKey] = { name: suiteName, testCases: [] };
      }

      cases?.forEach((testCase) => {
        const { suiteId: _suiteId, suiteName: _suiteName, ...rest } = testCase;
        grouped[suiteKey].testCases.push(rest);
      });
    });

    return grouped;
  }, [selectedTestExecution]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return theme.palette.success.main;
      case 'FAIL':
        return theme.palette.error.main;
      default:
        return theme.palette.warning.main;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'Passed';
      case 'FAIL':
        return 'Failed';
      default:
        return 'Not Executed';
    }
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const filteredTestSuites = useMemo(() => {
    if (!testSuites) return {};

    if (!failedOnly) return testSuites;

    const filtered: typeof testSuites = {};
    Object.entries(testSuites).forEach(([suiteId, group]) => {
      const failedCases = group.testCases.filter((tc) => tc.result === 'FAIL');
      if (failedCases.length > 0) {
        filtered[suiteId] = {
          name: group.name,
          testCases: failedCases,
        };
      }
    });
    return filtered;
  }, [testSuites, failedOnly]);

  return (
    <Stack className="ud-activity-wrap">
      <TabBar
        tabs={tabItems}
        onChange={handleTabChange}
        initialValue="activity"
        checkBoxProps={{
          checked: failedOnly,
          onChange: () => setFailedOnly((prev) => !prev),
          color: 'secondary',
          size: 'medium',
          disabled: selectTestExecutionLoading || !selectedTestExecution,
          className: 'ud-activity-checkbox',
        }}
      />
      {selectedTab === 'activity' ? (
        <Stack className="ud-activity-inner">
          {selectTestExecutionLoading ||
          !selectedTestExecution ||
          isEmpty(filteredTestSuites) ? (
            <Stack
              justifyContent="center"
              alignItems="center"
              className="ud-activity-empty"
            >
              <img src={NoData} width={140} height={140} />
              <Typography variant="h6" color="text.subtitle" noWrap>
                No Test Cases Found
              </Typography>
            </Stack>
          ) : (
            <>
              <Stack overflow="auto" padding="0.7rem">
                {filteredTestSuites &&
                  Object.entries(filteredTestSuites).map(([suiteId, group]) => (
                    <Stack key={suiteId} className="ud-activity-suite">
                      <Typography
                        variant="legend"
                        fontSize="0.875rem"
                        color="primary.500"
                      >
                        {group.name}
                      </Typography>
                      <Stack className="ud-activity-case-grid">
                        {group.testCases.map((testCase, index) => (
                          <Box
                            className="ud-activity-case-row"
                            key={`${suiteId}-${testCase.testCaseId}-${index}`}
                          >
                            <Stack>
                              <Typography variant="body3" color="text.caption">
                                {getDisplayDate(testCase.updatedAt ?? '')}
                              </Typography>
                            </Stack>
                            <Stack>
                              <Typography variant="body3" color="text.caption">
                                Testcase {String(index + 1).padStart(2, '0')}
                              </Typography>
                            </Stack>
                            <Stack>
                              <Typography
                                color={getStatusColor(testCase.result ?? '')}
                                variant="body3"
                                fontWeight={700}
                              >
                                {getStatusText(testCase.result ?? '')}
                              </Typography>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  ))}
              </Stack>
            </>
          )}
        </Stack>
      ) : (
        <Logs />
      )}
    </Stack>
  );
}

export default TestActivity;
