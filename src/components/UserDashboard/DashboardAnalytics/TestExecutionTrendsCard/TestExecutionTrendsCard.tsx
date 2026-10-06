import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import { useDispatch } from 'react-redux';
import dayjs, { type Dayjs } from 'dayjs';
import DateRangePickerPopover from 'components/common/DateRangePickerPopover';
import { fetchUserDashboardExecutionDailySummaryRequest } from 'store/slices/userDashboard/userDashboardSlice';
import type { ExecutionDailySummary } from 'typesCustom/analytics';
import type {
  DashboardTableRow,
  TrendPoint,
} from '../../shared/testExecutionData';
import {
  buildTrendDataFromDailySummary,
  buildTrendDataFromExecutions,
} from '../../shared/testExecutionData';
import DashboardTrendChart from './DashboardTrendChart';
import styles from './TestExecutionTrendsCard.module.scss';

interface TestExecutionTrendsCardProps {
  executions: DashboardTableRow[];
  executionDailySummary: ExecutionDailySummary[];
  onTrendDateSelect?: (isoDate: string) => void;
}

const formatDisplayDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

const getNiceAxisMax = (maxValue: number, minimum: number) => {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return minimum;

  const padded = maxValue * 1.15;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const normalized = padded / magnitude;

  let roundedNormalized = 1;
  if (normalized <= 1) roundedNormalized = 1;
  else if (normalized <= 2) roundedNormalized = 2;
  else if (normalized <= 5) roundedNormalized = 5;
  else roundedNormalized = 10;

  return Math.max(minimum, roundedNormalized * magnitude);
};

const buildAxisTicks = (maxValue: number, stepCount = 4) =>
  Array.from({ length: stepCount + 1 }, (_, index) => {
    const value = (maxValue / stepCount) * index;
    return Number(value.toFixed(1));
  });

function TestExecutionTrendsCard({
  executions,
  executionDailySummary,
  onTrendDateSelect,
}: TestExecutionTrendsCardProps) {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [defaultTrendRange] = useState(() => {
    const today = dayjs().startOf('day');

    return {
      from: today.subtract(4, 'day'),
      to: today,
    };
  });

  const [datePickerAnchorEl, setDatePickerAnchorEl] =
    useState<HTMLElement | null>(null);
  const [appliedFromDate, setAppliedFromDate] = useState<Dayjs>(
    defaultTrendRange.from,
  );
  const [appliedToDate, setAppliedToDate] = useState<Dayjs>(
    defaultTrendRange.to,
  );

  const isDatePickerOpen = Boolean(datePickerAnchorEl);

  const handleDatePickerOpen = (event: MouseEvent<HTMLElement>) => {
    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleDatePickerClose = () => setDatePickerAnchorEl(null);

  const handleApplyDates = (nextFromDate: Date, nextToDate: Date) => {
    setDatePickerAnchorEl(null);

    startTransition(() => {
      setAppliedFromDate(dayjs(nextFromDate).startOf('day'));
      setAppliedToDate(dayjs(nextToDate).startOf('day'));
    });
  };

  const appliedFromDateStr = appliedFromDate.format('YYYY-MM-DD');
  const appliedToDateStr = appliedToDate.format('YYYY-MM-DD');

  useEffect(() => {
    dispatch(
      fetchUserDashboardExecutionDailySummaryRequest({
        from: appliedFromDateStr,
        to: appliedToDateStr,
      }),
    );
  }, [dispatch, appliedFromDateStr, appliedToDateStr]);

  const rangeTrendData: TrendPoint[] = useMemo(
    () =>
      executionDailySummary.length > 0
        ? buildTrendDataFromDailySummary(
            executionDailySummary,
            appliedFromDate,
            appliedToDate,
          )
        : buildTrendDataFromExecutions(
            executions,
            appliedFromDate,
            appliedToDate,
          ),
    [executionDailySummary, executions, appliedFromDate, appliedToDate],
  );

  const displayFromDate = formatDisplayDate(
    appliedFromDate.format('YYYY-MM-DD'),
  );
  const displayToDate = formatDisplayDate(appliedToDate.format('YYYY-MM-DD'));

  const daysToShow = 10;
  const dayBarWidth = 88;
  const chartContentWidth =
    Math.max(rangeTrendData.length, daysToShow) * dayBarWidth;

  const testsAxisMax = useMemo(() => {
    const maxTests = rangeTrendData.reduce(
      (max, point) => Math.max(max, point.passed, point.failed),
      0,
    );
    return getNiceAxisMax(maxTests, 10);
  }, [rangeTrendData]);

  const durationAxisMax = useMemo(() => {
    const maxDuration = rangeTrendData.reduce(
      (max, point) => Math.max(max, point.durationMinutes),
      0,
    );
    return getNiceAxisMax(maxDuration, 5);
  }, [rangeTrendData]);

  const testsAxisTicks = useMemo(
    () => buildAxisTicks(testsAxisMax),
    [testsAxisMax],
  );
  const durationAxisTicks = useMemo(
    () => buildAxisTicks(durationAxisMax),
    [durationAxisMax],
  );

  return (
    <Box className={styles.card}>
      <Stack
        className={styles.header}
        direction="row"
        justifyContent="space-between"
      >
        <Typography variant="h6" className={styles.title}>
          Test Execution Trends
        </Typography>
        <Chip
          icon={<CalendarTodayOutlinedIcon />}
          label={`${displayFromDate} - ${displayToDate}`}
          size="small"
          className={styles.rangeChip}
          onClick={handleDatePickerOpen}
          sx={{ cursor: 'pointer' }}
        />
      </Stack>

      <Stack direction="row" gap="1rem" className={styles.legendRow}>
        <Stack direction="row" alignItems="center" gap="0.35rem">
          <FiberManualRecordRoundedIcon
            sx={{ color: theme.palette.success.main, fontSize: '0.85rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            Passed
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap="0.35rem">
          <FiberManualRecordRoundedIcon
            sx={{ color: theme.palette.error.main, fontSize: '0.85rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            Failed
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" gap="0.35rem">
          <FiberManualRecordRoundedIcon
            sx={{ color: theme.palette.primary.main, fontSize: '0.85rem' }}
          />
          <Typography variant="caption" color="text.secondary">
            Duration (min)
          </Typography>
        </Stack>
      </Stack>

      <Box className={styles.viewport}>
        <Box className={styles.content} sx={{ width: chartContentWidth }}>
          <DashboardTrendChart
            minChartWidth={chartContentWidth}
            durationAxisMax={durationAxisMax}
            durationAxisTicks={durationAxisTicks}
            trendData={rangeTrendData}
            testsAxisMax={testsAxisMax}
            testsAxisTicks={testsAxisTicks}
            theme={theme}
            onTrendDateSelect={onTrendDateSelect}
          />
        </Box>
      </Box>

      <DateRangePickerPopover
        open={isDatePickerOpen}
        anchorEl={datePickerAnchorEl}
        fromDate={appliedFromDate.toDate()}
        toDate={appliedToDate.toDate()}
        maxDate={defaultTrendRange.to.toDate()}
        onClose={handleDatePickerClose}
        onApply={handleApplyDates}
        formatDisplayDate={formatDisplayDate}
      />
    </Box>
  );
}

export default TestExecutionTrendsCard;
