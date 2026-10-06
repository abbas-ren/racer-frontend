import { Stack, Typography, useTheme, Box } from '@mui/material';
import { Pie, PieChart } from 'recharts';
import CustomLabel from 'components/Dashboard/DeviceUsagePiePanel/CustomLabel';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import { useEffect, useMemo } from 'react';
import { normalizePercentages } from 'utils/test';
import { useDebounce } from '@uidotdev/usehooks';
import { fetchTestPlanSummaryRequest } from 'store/slices';
import clsx from 'clsx';
import { camel } from 'radash';

const LEGEND_AREA_CLASS: Record<string, string> = {
  completed: 'ud-summary-completed',
  inProgress: 'ud-summary-in-progress',
  failed: 'ud-summary-failed',
  cancelled: 'ud-summary-cancelled',
};

function TestPlansSummary() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const testPlanSummary = useSelector(
    (state: RootState) => state.tests.testPlanSummary,
  );
  const debouncedAllTime = useDebounce(testPlanSummary, 1000);
  const data = useMemo(() => {
    if (!debouncedAllTime) {
      return {
        filtered: [],
        raw: [],
      };
    }

    const total = debouncedAllTime.total || 0;
    const completed = debouncedAllTime.completed || 0;
    const failed = debouncedAllTime.failed || 0;
    const inProgress = debouncedAllTime.inProgress || 0;
    const cancelled = debouncedAllTime.cancelled || 0;

    const counts = [completed, failed, inProgress, cancelled];
    const [
      completedPercentage,
      failedPercentage,
      inProgressPercentage,
      cancelledPercentage,
    ] = total > 0 ? normalizePercentages(counts) : [0, 0, 0, 0];

    const returnVal = [
      {
        name: `${completedPercentage}%`,
        legend: 'Completed',
        value: completedPercentage,
        count: debouncedAllTime.completed,
        color: theme.palette.success.main,
        fill: theme.palette.success.main,
      },
      {
        name: `${inProgressPercentage}%`,
        legend: 'In Progress',
        value: inProgressPercentage,
        count: debouncedAllTime.inProgress,
        color: theme.palette.info.main,
        fill: theme.palette.info.main,
      },
      {
        name: `${failedPercentage}%`,
        legend: 'Failed',
        value: failedPercentage,
        count: debouncedAllTime.failed,
        color: theme.palette.error.main,
        fill: theme.palette.error.main,
      },
      {
        name: `${cancelledPercentage}%`,
        legend: 'Cancelled',
        value: cancelledPercentage,
        count: debouncedAllTime.cancelled,
        color: theme.palette.grey[500],
        fill: theme.palette.grey[500],
      },
    ];

    return {
      filtered: returnVal.filter((val) => val.value > 0),
      raw: returnVal.slice(),
    };
  }, [debouncedAllTime, theme]);

  useEffect(() => {
    if (dispatch) {
      dispatch(fetchTestPlanSummaryRequest());
    }
  }, [dispatch]);

  return (
    <Stack className="ud-summary-wrap">
      <Typography variant="h6" fontWeight={600} color="primary">
        Summary of Test Plans
      </Typography>
      <Stack gap="1.5rem" direction="row">
        <Stack alignItems="center" justifyContent="center" flex="1">
          <PieChart width={130} height={130}>
            <Pie
              data={
                data.filtered?.length > 0
                  ? data.filtered
                  : [
                      {
                        name: ``,
                        legend: '',
                        value: 100,
                        count: debouncedAllTime.cancelled,
                        color: theme.palette.grey[100],
                        fill: theme.palette.grey[300],
                      },
                    ]
              }
              cx="50%"
              cy="50%"
              innerRadius={22}
              outerRadius={65}
              dataKey="value"
              label={(props) => <CustomLabel {...props} fontSize={10} />}
              isAnimationActive={true}
              labelLine={false}
              paddingAngle={0}
              stroke="none"
            ></Pie>
          </PieChart>
        </Stack>
        <Box className="ud-summary-legend" gap="0.5rem">
          <Stack className="ud-summary-legend-item ud-summary-total">
            <Typography variant="body4" fontSize="0.6rem">
              Total
            </Typography>
            <Typography
              variant="body1"
              color="primary"
              fontWeight={500}
              fontSize="1.5rem"
            >
              {debouncedAllTime.total}
            </Typography>
          </Stack>
          {data.raw.map((entry, index) => (
            <Stack
              className={clsx(
                'ud-summary-legend-item',
                LEGEND_AREA_CLASS[camel(entry.legend)] ?? '',
              )}
              key={entry.name + index}
            >
              <Stack
                key={index}
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <Box
                  width={10}
                  height={10}
                  borderRadius="24%"
                  bgcolor={entry.color}
                />
                <Typography variant="body4" fontSize="0.6rem">
                  {entry.legend}
                </Typography>
              </Stack>
              <Typography
                variant="body1"
                color="primary"
                fontWeight={500}
                fontSize="1rem"
              >
                {entry.count}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Stack>
    </Stack>
  );
}

export default TestPlansSummary;
