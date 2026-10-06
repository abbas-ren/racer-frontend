import { Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material';
import { useEffect, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { useDispatch, useSelector } from 'react-redux';
import { downloadDevicesRequest, fetchDeviceRequest } from 'store/slices';
import StatusLabel from 'components/common/StatusLabel';
import { DeviceState } from 'typesCustom/components';
import Button from 'components/common/Button';
import { ButtonPreset } from 'typesCustom/types';
import { SquareSplit } from 'assets';
import CustomInputField from 'components/common/InputField';
import TableColumnsCustomize from './TableColumnCustomize';
import styles from './DeviceDetailsTable.module.scss';
import { RootState } from 'store/store';

function TableTopHeader() {
  const dispatch = useDispatch();
  const { downloading } = useSelector(
    (state: RootState) => state.device.download,
  );

  const handleExport = () => {
    dispatch(
      downloadDevicesRequest({
        status: 'approved',
      }),
    );
  };
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const debounceSearch = useDebounce(search, 500);

  useEffect(() => {
    dispatch(
      fetchDeviceRequest({
        search: debounceSearch,
      }),
    );
  }, [debounceSearch, dispatch]);

  return (
    <Stack direction="row" className={styles.tableTopHeaderContainer}>
      <Stack direction="row" gap="1.25rem">
        <StatusLabel type={DeviceState.AVAILABLE} />
        <StatusLabel type={DeviceState.BUSY} />
        <StatusLabel type={DeviceState.FAULTY} />
        <StatusLabel type={DeviceState.NOT_REACHABLE} />
      </Stack>
      <Stack direction="row" gap="1.25rem">
        <Button
          outlined={true}
          onClick={() => !downloading && handleExport()}
          preset={ButtonPreset.Primary}
          className={styles.downloadButton}
        >
          <Typography variant="buttonBase">
            {downloading ? 'Downloading...' : 'Download Data'}
          </Typography>
        </Button>
        <Stack direction="row" gap="0.675rem">
          <Stack justifyContent="center" alignItems="center">
            <img src={SquareSplit} />
          </Stack>
          <TableColumnsCustomize />
          <CustomInputField
            placeholder="Search"
            floating={false}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            inputStyle={{
              height: '1.875rem',
              ...theme.typography.body2,
            }}
            specificWidth="150px"
          />
        </Stack>
      </Stack>
    </Stack>
  );
}

export default TableTopHeader;
