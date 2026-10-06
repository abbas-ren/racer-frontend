import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
} from 'recharts';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { RootState } from 'store/store';
import { useSelector } from 'react-redux';
import { ToggleSwitch } from 'components/common';
import { useDebounce, useWindowSize } from '@uidotdev/usehooks';
import LegendLabel from 'components/Dashboard/DeviceUsageGraph/LegendLabel';

type CustomBarProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  highlight?: string;
};

function TestOverViewGraph() {
  const size = useWindowSize();
  const responsiveSize = useMemo(() => {
    const defaultSize = { tickCount: 6, fontSize: 14 };
    if (!size || !size.width) return defaultSize;
    if (size.width >= 1200 && size.width <= 1450) {
      return { tickCount: 4, fontSize: 12 };
    }
    if (size.width < 1200) {
      return { tickCount: 3, fontSize: 10 };
    }
    return defaultSize;
  }, [size]);

  const theme = useTheme();
  const [selected, setSelected] = useState('Weekly');
  const analytics = useSelector((state: RootState) => state.tests.analytics);
  const debouncedAnalytics = useDebounce(analytics, 500);

  const data = useMemo(() => {
    if (
      !debouncedAnalytics ||
      !debouncedAnalytics.weekly ||
      !debouncedAnalytics.monthly
    ) {
      return [];
    }

    const rawData =
      selected === 'Monthly'
        ? debouncedAnalytics.monthly.map((item) => ({
            name: item.month,
            Passed: item.passed || 0,
            'In Progress': item.inProgress || 0,
            Failed: item.failed || 0,
          }))
        : debouncedAnalytics.weekly.map((item) => ({
            name: item.week,
            Passed: item.passed || 0,
            'In Progress': item.inProgress || 0,
            Failed: item.failed || 0,
          }));

    return rawData.slice(-responsiveSize.tickCount);
  }, [debouncedAnalytics, selected, responsiveSize]);

  const CustomizedShape = (props: CustomBarProps) => {
    const { x, y, width, height, fill, highlight } = props;
    const baseColor = fill;
    const borderColor = highlight;

    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={baseColor} />
        <rect x={x} y={y} width={width} height={1.5} fill={borderColor} />
      </g>
    );
  };

  const COLORS = {
    passed: theme.palette.success.main,
    inProgress: theme.palette.info.main,
    failed: theme.palette.error.main,
  };

  const HIGHLIGHT_COLORS = {
    passed: theme.palette.success.strong,
    inProgress: theme.palette.info.strong,
    failed: theme.palette.error.strong,
  };
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          gap="1.25rem"
        >
          <Typography variant="h6" fontWeight={600} color="primary">
            Test Overview
          </Typography>
          <LegendLabel
            color={theme.palette.success.main}
            label="Passed Tests"
          />
          <LegendLabel
            color={theme.palette.info.main}
            label="In Progress Tests"
          />
          <LegendLabel color={theme.palette.error.main} label="Failed Tests" />
        </Stack>
        <ToggleSwitch
          options={['Weekly', 'Monthly']}
          selected={selected}
          onChange={setSelected}
        />
      </Stack>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barGap={16} margin={{ top: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: responsiveSize.fontSize }}
            interval={0}
            tickCount={responsiveSize.tickCount}
          />
          <YAxis
            tick={{ fontSize: 14 }}
            label={{
              value: 'Number of Tests',
              angle: -90,
              position: 'insideLeft',
              style: {
                textAnchor: 'middle',
                ...theme.typography.body4,
              },
            }}
          />
          <Bar
            dataKey="Passed"
            fill={COLORS.passed}
            shape={(props) => (
              <CustomizedShape {...props} highlight={HIGHLIGHT_COLORS.passed} />
            )}
          >
            <LabelList dataKey="Passed" position="top" fontSize={14} />
          </Bar>
          <Bar
            dataKey="In Progress"
            fill={COLORS.inProgress}
            shape={(props) => (
              <CustomizedShape
                {...props}
                highlight={HIGHLIGHT_COLORS.inProgress}
              />
            )}
          >
            <LabelList dataKey="In Progress" position="top" fontSize={14} />
          </Bar>
          <Bar
            dataKey="Failed"
            fill={COLORS.failed}
            shape={(props) => (
              <CustomizedShape {...props} highlight={HIGHLIGHT_COLORS.failed} />
            )}
          >
            <LabelList dataKey="Failed" position="top" fontSize={14} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default TestOverViewGraph;
