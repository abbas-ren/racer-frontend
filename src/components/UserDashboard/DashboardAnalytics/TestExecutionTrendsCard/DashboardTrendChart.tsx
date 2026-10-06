import { memo } from 'react';
import { Box } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '../../shared/testExecutionData';
import DashboardTrendTooltip from './DashboardTrendTooltip';
import styles from './DashboardTrendChart.module.scss';

interface DashboardTrendChartProps {
  minChartWidth: number;
  durationAxisMax: number;
  durationAxisTicks: number[];
  trendData: TrendPoint[];
  testsAxisMax: number;
  testsAxisTicks: number[];
  theme: Theme;
  onTrendDateSelect?: (isoDate: string) => void;
}

const DashboardTrendChart = memo(function DashboardTrendChart({
  minChartWidth,
  durationAxisMax,
  durationAxisTicks,
  trendData,
  testsAxisMax,
  testsAxisTicks,
  theme,
  onTrendDateSelect,
}: DashboardTrendChartProps) {
  const durationColor = theme.palette.primary.main;

  const handleTrendSelection = (point: TrendPoint) => {
    onTrendDateSelect?.(point.date);
  };

  const handleTrendSelectionByIndex = (index: number) => {
    const point = trendData[index];
    if (!point) return;

    handleTrendSelection(point);
  };

  const handleChartClick = (state: unknown) => {
    const chartState = state as {
      activeLabel?: string;
      activePayload?: Array<{ payload?: TrendPoint }>;
    };

    const selectedPoint = chartState.activePayload?.[0]?.payload;
    if (selectedPoint?.date) {
      handleTrendSelection(selectedPoint);
      return;
    }

    const activeLabel = chartState.activeLabel;
    if (!activeLabel) return;

    const matchedPoint = trendData.find((point) => point.label === activeLabel);
    if (matchedPoint) {
      handleTrendSelection(matchedPoint);
    }
  };

  return (
    <Box className={styles.trendChartWrap}>
      <Box
        className={styles.trendChartInner}
        sx={{ minWidth: `${minChartWidth}px` }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trendData}
            margin={{ top: 16, right: 24, left: 6, bottom: 4 }}
            barGap={4}
            barCategoryGap="12%"
            onClick={handleChartClick}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={theme.palette.divider}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 13, fill: theme.palette.text.secondary }}
            />
            <YAxis
              yAxisId="tests"
              tickLine={false}
              axisLine={false}
              domain={[0, testsAxisMax]}
              ticks={testsAxisTicks}
              tick={{ fontSize: 13, fill: theme.palette.text.secondary }}
              width={40}
              tickMargin={8}
            />
            <YAxis
              yAxisId="duration"
              orientation="right"
              tickLine={false}
              axisLine={false}
              domain={[0, durationAxisMax]}
              ticks={durationAxisTicks}
              tick={{ fontSize: 13, fill: theme.palette.text.secondary }}
              width={52}
              tickMargin={10}
            />
            <Tooltip
              content={<DashboardTrendTooltip />}
              cursor={{ fill: theme.palette.action.hover }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Bar
              yAxisId="tests"
              dataKey="passed"
              fill={theme.palette.success.main}
              radius={[6, 6, 0, 0]}
              maxBarSize={20}
              cursor="pointer"
              onMouseDown={(_, index) => handleTrendSelectionByIndex(index)}
              onClick={(_, index) => handleTrendSelectionByIndex(index)}
            />
            <Bar
              yAxisId="tests"
              dataKey="failed"
              fill={theme.palette.error.main}
              radius={[6, 6, 0, 0]}
              maxBarSize={20}
              cursor="pointer"
              onMouseDown={(_, index) => handleTrendSelectionByIndex(index)}
              onClick={(_, index) => handleTrendSelectionByIndex(index)}
            />
            <Bar
              yAxisId="duration"
              dataKey="durationMinutes"
              fill={durationColor}
              radius={[6, 6, 0, 0]}
              maxBarSize={20}
              minPointSize={3}
              cursor="pointer"
              onMouseDown={(_, index) => handleTrendSelectionByIndex(index)}
              onClick={(_, index) => handleTrendSelectionByIndex(index)}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
});

export default DashboardTrendChart;
