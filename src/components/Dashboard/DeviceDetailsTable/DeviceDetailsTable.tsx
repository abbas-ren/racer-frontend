import { Stack } from '@mui/material';
import styles from './DeviceDetailsTable.module.scss';
import TableTopHeader from './TableTopHeader';
import Table from './Table';

function DeviceDetailsTable() {
  return (
    <Stack className={styles.container} gap="0.25rem">
      <TableTopHeader />
      <Table />
    </Stack>
  );
}

export default DeviceDetailsTable;
