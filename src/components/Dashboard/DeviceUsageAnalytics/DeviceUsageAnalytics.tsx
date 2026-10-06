import { Stack } from '@mui/material';
import styles from './DeviceUsageAnalytics.module.scss';
import DeviceUsagePiePanel from '../DeviceUsagePiePanel';
import DeviceUsageGraph from '../DeviceUsageGraph';

function DeviceUsageAnalytics() {
  return (
    <Stack className={styles.container} direction="row">
      <DeviceUsagePiePanel />
      <DeviceUsageGraph />
    </Stack>
  );
}

export default DeviceUsageAnalytics;
