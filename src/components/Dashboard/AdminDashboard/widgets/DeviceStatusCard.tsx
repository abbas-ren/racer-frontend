import { PieChart as PieIcon } from 'lucide-react';
import { Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material';
import CardHeader from './CardHeader';
import { DeviceStatusItem } from '../types';
import { composeDashboardClasses } from '../styles/dashboardStyles';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeviceStateAnalyticsRequest, RootState } from 'store/index';
import { useEffect, useMemo } from 'react';
import { DeviceState } from 'typesCustom/components';
import { getDeviceStateColor, getDeviceStateLabel } from 'utils/dashboard';
import { useAlertSocket } from 'hooks/useAlertSocket';
import { AlertData } from 'services/wsClient';

const DeviceStatusCard = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    dispatch(fetchDeviceStateAnalyticsRequest());
  }, [dispatch]);

  useAlertSocket((alert: AlertData) => {
    if (
      alert.subtype === 'device-approval' ||
      alert.subtype === 'device-state-change' ||
      alert.subtype === 'device-deletion'
    ) {
      dispatch(fetchDeviceStateAnalyticsRequest());
    }
  });

  const deviceState = useSelector(
    (state: RootState) => state.dashboard.deviceState,
  );

  const resolvedData = useMemo(() => {
    const total = deviceState?.total ?? 0;
    const getCount = (stateKey: DeviceState) =>
      deviceState?.stateCount?.get?.(stateKey) ?? 0;

    const mapped: DeviceStatusItem[] = [
      {
        name: getDeviceStateLabel({ type: DeviceState.AVAILABLE }),
        value: getCount(DeviceState.AVAILABLE),
        color: getDeviceStateColor({ type: DeviceState.AVAILABLE, theme }),
      },
      {
        name: getDeviceStateLabel({ type: DeviceState.NOT_REACHABLE }),
        value: getCount(DeviceState.NOT_REACHABLE),
        color: getDeviceStateColor({ type: DeviceState.NOT_REACHABLE, theme }),
      },
      {
        name: getDeviceStateLabel({ type: DeviceState.FAULTY }),
        value: getCount(DeviceState.FAULTY),
        color: getDeviceStateColor({ type: DeviceState.FAULTY, theme }),
      },
      {
        name: getDeviceStateLabel({ type: DeviceState.BUSY }),
        value: getCount(DeviceState.BUSY),
        color: getDeviceStateColor({ type: DeviceState.BUSY, theme }),
      },
    ];

    return mapped.map((item) => ({
      ...item,
      percentage: `${total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}%`,
    }));
  }, [deviceState, theme]);

  const chartData = useMemo(
    () => resolvedData.map((item) => ({ ...item, fill: item.color })),
    [resolvedData],
  );

  return (
    <div className={composeDashboardClasses('card')}>
      <CardHeader icon={PieIcon} title="Device Status" />
      <div className={composeDashboardClasses('pie-chart-container')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={composeDashboardClasses('chart-center-text')}>
          <span>{deviceState?.total ?? 0}</span>
        </div>
      </div>
      <div className={composeDashboardClasses('legend-grid')}>
        {resolvedData.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className={composeDashboardClasses('legend-item')}
          >
            <div className={composeDashboardClasses('legend-item-title')}>
              <div
                className={composeDashboardClasses('legend-item-dot')}
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </div>
            <div className={composeDashboardClasses('legend-item-stats')}>
              <span className={composeDashboardClasses('legend-item-value')}>
                {item.value}
              </span>
              <span className={composeDashboardClasses('legend-item-percent')}>
                {item.percentage} of total
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceStatusCard;
