import { Stack, Typography, useTheme } from '@mui/material';
import styles from './DeviceUsageGraph.module.scss';
import { useEffect, useMemo, useState } from 'react';
import { ToggleSwitch } from 'components/common';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeviceUsageAnalyticsSummaryRequest, RootState } from 'store';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useAlertSocket } from '../../../hooks/useAlertSocket';
import { AlertData } from '../../../services/wsClient';
import LegendLabel from './LegendLabel';
import {
  CustomBarWithCap,
  transformAnalyticsToChartData,
} from './GraphChartUtils';

function DeviceUsageGraph() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [selected, setSelected] = useState('Weekly');
  const deviceUsageSummary = useSelector(
    (state: RootState) => state.dashboard.deviceUsageSummary,
  );

  const chartData = useMemo(
    () =>
      transformAnalyticsToChartData(
        (deviceUsageSummary || {}) as { weekly?: unknown; monthly?: unknown },
        selected.toLowerCase() as 'weekly' | 'monthly',
      ),
    [deviceUsageSummary, selected],
  );

  useEffect(() => {
    dispatch(fetchDeviceUsageAnalyticsSummaryRequest());
  }, [dispatch]);

  // chartData derived via useMemo; avoid setState in effects

  useAlertSocket((alert: AlertData) => {
    if (alert.subtype === 'device-approval') {
      dispatch(fetchDeviceUsageAnalyticsSummaryRequest());
    }
    if (alert.subtype === 'device-deletion') {
      dispatch(fetchDeviceUsageAnalyticsSummaryRequest());
    }
  });

  return (
    <Stack className={styles.container}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        padding="0px 0px 10px 0px"
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          gap="1.25rem"
        >
          <Typography variant="subtitle2" color="primary.500">
            All Devices Usage
          </Typography>
          <LegendLabel
            color={theme.palette.success.main}
            label="Device Utilized"
          />
          <LegendLabel color={theme.palette.info.main} label="Device Idle" />
          <LegendLabel
            color={theme.palette.error.lite}
            label="Number of Devices"
          />
        </Stack>
        <ToggleSwitch
          options={['Weekly', 'Monthly']}
          selected={selected}
          onChange={setSelected}
        />
      </Stack>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
          barCategoryGap="20%"
          barGap={16}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: '12px' }} />
          {/* Left Y-Axis */}
          <YAxis
            yAxisId="left"
            orientation="left"
            tickCount={5}
            tick={{ fontSize: '10px' }}
            label={{
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: {
                textAnchor: 'middle',
                fill: '#555',
                fontSize: 12,
                fontWeight: 'bold',
              },
            }}
          />
          {/* Right Y-Axis */}
          <YAxis
            yAxisId="right"
            dataKey="totalDevices"
            orientation="right"
            tickFormatter={(value) => Math.round(value).toString()}
            tickCount={5}
            tick={{ fontSize: '10px' }}
            label={{
              value: 'Devices',
              angle: -90,
              position: 'insideStart',
              style: {
                textAnchor: 'middle',
                fill: '#555',
                fontSize: 12,
                fontWeight: 'bold',
              },
            }}
          />
          <Bar
            yAxisId="left"
            dataKey="busy"
            name="Device Utilized"
            fill={theme.palette.success.main}
            shape={<CustomBarWithCap />}
            isAnimationActive={false}
            activeBar={false}
          >
            <LabelList
              dataKey="busy"
              position="top"
              offset={10}
              formatter={(value) => Number(value)}
              fill="#000"
              fontSize={10}
            />
          </Bar>

          <Bar
            yAxisId="left"
            dataKey="free"
            name="Device Idle"
            fill={theme.palette.info.main}
            shape={<CustomBarWithCap />}
            isAnimationActive={false}
            activeBar={false}
          >
            <LabelList
              dataKey="free"
              position="top"
              offset={10}
              formatter={(value) => Number(value)}
              fill="#000"
              fontSize={10}
            />
          </Bar>

          <Bar
            yAxisId="right"
            dataKey="totalDevices"
            name="Number of Devices"
            fill={theme.palette.error.lite}
            shape={<CustomBarWithCap />}
            isAnimationActive={false}
            activeBar={false}
          >
            <LabelList
              dataKey="totalDevices"
              position="top"
              offset={10}
              formatter={(value) => Math.round(Number(value))}
              fill="#000"
              fontSize={10}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Stack>
  );
}

export default DeviceUsageGraph;
