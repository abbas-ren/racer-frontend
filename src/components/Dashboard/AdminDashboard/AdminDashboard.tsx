import { useCallback, useEffect, useMemo, useState } from 'react';
import { dashboardStyles as styles } from './styles/dashboardStyles';
import { AlertItem, BuildPerformanceItem, UsageDataItem } from './types';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import {
  clearAlertDetail,
  fetchDeviceUsageAnalyticsSummaryRequest,
} from 'store/slices';
import { transformAnalyticsToChartData } from 'components/Dashboard/DeviceUsageGraph/GraphChartUtils';

import ActiveAlertsCard from './widgets/ActiveAlertsCard';
import AlertModal from './widgets/alertModal/AlertModal';
import AllDevicesUsageCard from './widgets/AllDevicesUsageCard';
import BuildPerformanceCard from './widgets/BuildPerformanceCard';
import BuildSidebar from './widgets/BuildSidebar';
import DeviceFamiliesCard from './widgets/DeviceFamiliesCard';
import DeviceStatusCard from './widgets/DeviceStatusCard';
import { useBuildSidebarWebSocket } from 'hooks/useBuildSidebarWebSocket';
import { useAdminDashboardWebSocket } from 'hooks/useAdminDashboardWebSocket';

function AdminDashboard() {
  const dispatch = useDispatch();
  const deviceUsageSummary = useSelector(
    (state: RootState) => state.dashboard.deviceUsageSummary,
  );

  const [selectedBuild, setSelectedBuild] =
    useState<BuildPerformanceItem | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [usageTimeframe, setUsageTimeframe] = useState<'monthly' | 'weekly'>(
    'monthly',
  );
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    dispatch(fetchDeviceUsageAnalyticsSummaryRequest());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearAlertDetail());
    };
  }, [dispatch]);

  const weeklyBarChartData: UsageDataItem[] = useMemo(() => {
    const chartRows = transformAnalyticsToChartData(
      (deviceUsageSummary || {}) as { weekly?: unknown; monthly?: unknown },
      'weekly',
    );

    return chartRows.map((row) => ({
      name: row.name,
      idle: row.free,
      utilized: row.busy,
      devices: row.totalDevices,
    }));
  }, [deviceUsageSummary]);

  const monthlyBarChartData: UsageDataItem[] = useMemo(() => {
    const chartRows = transformAnalyticsToChartData(
      (deviceUsageSummary || {}) as { weekly?: unknown; monthly?: unknown },
      'monthly',
    );

    return chartRows.map((row) => ({
      name: row.name,
      idle: row.free,
      utilized: row.busy,
      devices: row.totalDevices,
    }));
  }, [deviceUsageSummary]);

  const currentChartData =
    usageTimeframe === 'monthly' ? monthlyBarChartData : weeklyBarChartData;

  useAdminDashboardWebSocket('admin');

  const { disconnect } = useBuildSidebarWebSocket({
    buildId: selectedBuild?.buildId ?? null,
  });

  const handleBuildClick = useCallback((build: BuildPerformanceItem) => {
    setSelectedBuild(build);
  }, []);

  const handleClose = useCallback(() => {
    disconnect();
    setSelectedBuild(null);
  }, [disconnect]);

  const handleAlertClose = useCallback(() => {
    setSelectedAlert(null);
    dispatch(clearAlertDetail());
  }, [dispatch]);

  return (
    <div className={styles['dashboard-container']}>
      <div className={styles['top-row']}>
        <DeviceStatusCard />
        <DeviceFamiliesCard />
        <BuildPerformanceCard onBuildClick={handleBuildClick} />
      </div>

      <div className={styles['bottom-row']}>
        <ActiveAlertsCard onAlertClick={setSelectedAlert} />
        <AllDevicesUsageCard
          usageTimeframe={usageTimeframe}
          setUsageTimeframe={setUsageTimeframe}
          currentChartData={currentChartData}
        />
      </div>

      <BuildSidebar
        selectedBuild={selectedBuild}
        onClose={handleClose}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarConfig={null}
      />

      <AlertModal
        selectedAlert={selectedAlert}
        onClose={handleAlertClose}
        modalConfig={null}
      />
    </div>
  );
}

export default AdminDashboard;
