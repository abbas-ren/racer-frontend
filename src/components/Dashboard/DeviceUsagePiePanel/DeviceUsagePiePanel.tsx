import { Stack, Typography, useTheme } from '@mui/material';
import styles from './DeviceUsagePiePanel.module.scss';
import { Pie, PieChart } from 'recharts';
import CustomLabel from './CustomLabel';
import Dropdown from 'components/common/DropDown';
import { useEffect, useMemo } from 'react';
import DatePicker from 'components/common/DatePicker';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDeviceUsageAnalyticsDailyRequest,
  setSelectedDate,
  setSelectedDevice,
  setSelectedDeviceFamily,
} from 'store/slices';
import { RootState } from 'store/store';
import { Dayjs } from 'dayjs';
import { useAlertSocket } from 'hooks/useAlertSocket';
import { AlertData } from 'services/wsClient';
import { DEVICE_FAMILY } from 'constants/tests';
import { buildPiePanelData, PiePanel } from './usagePiePanelDataUtils';

function DeviceUsagePiePanel() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const {
    deviceUsageDaily,
    selectedDeviceFamily,
    selectedDevice,
    selectedDate,
    deviceInFamilyList: deviceList,
  } = useSelector((state: RootState) => state.dashboard);

  const deviceFamily = [
    { value: 'all', label: 'All' },
    ...DEVICE_FAMILY.map((item) => ({ value: item, label: item })),
  ];

  const filteredData: PiePanel = useMemo(() => {
    return buildPiePanelData(deviceUsageDaily, theme.palette);
  }, [deviceUsageDaily, theme.palette]);

  const devices = deviceList.map((device) => ({
    value: device.deviceId,
    label: device.deviceType,
  }));

  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (user && (!deviceList || deviceList.length === 0)) {
      dispatch(fetchDeviceUsageAnalyticsDailyRequest({}));
    }
  }, [user, deviceList, dispatch]);

  useAlertSocket((alert: AlertData) => {
    if (alert.subtype === 'device-approval') {
      dispatch(setSelectedDeviceFamily('all'));
    }
    if (alert.subtype === 'device-deletion') {
      if (user && (!deviceList || deviceList.length === 0)) {
        dispatch(fetchDeviceUsageAnalyticsDailyRequest({}));
      }
    }
  });

  // Derived values handled via useMemo above; no setState in effects.

  return (
    <Stack className={styles.container}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="primary.500">
          Device Usage
        </Typography>
        <Stack direction="row" gap="0.25rem">
          <Dropdown
            value={selectedDeviceFamily ? selectedDeviceFamily : ''}
            onChange={(e) =>
              dispatch(setSelectedDeviceFamily(e.target.value as string))
            }
            items={deviceFamily}
            placeholder="Family"
            rootClass={styles.dropDownStyle}
          />
          <Dropdown
            value={selectedDevice ? selectedDevice : ''}
            onChange={(e) =>
              dispatch(setSelectedDevice(e.target.value as string))
            }
            items={devices}
            rootClass={styles.dropDownStyle}
            placeholder="Device"
          />
          <DatePicker
            value={selectedDate ? selectedDate : null}
            onChange={(newVal: Dayjs | null) =>
              dispatch(setSelectedDate(newVal))
            }
          ></DatePicker>
        </Stack>
      </Stack>
      <Stack direction="row">
        <Stack gap="0.325rem">
          <Stack
            direction="row"
            alignItems="center"
            gap="0.25rem"
            className={styles.textContainer}
          >
            <Typography variant="caption" component="p" color="text.caption">
              Number of Devices:
            </Typography>
            <Typography
              component="span"
              fontSize="0.875rem"
              color="primary.300"
              variant="subtitle2"
            >
              {deviceUsageDaily?.totalDevices}
            </Typography>
          </Stack>
          <Stack className={styles.labelContainer}>
            <Typography
              variant="caption"
              fontSize="0.75rem"
              color="text.caption"
            >
              Utilized
              <Typography component="span" variant="caption" fontSize="0.6rem">
                &nbsp;(Hours)
              </Typography>
            </Typography>
            {deviceUsageDaily?.totalDevices && (
              <Typography
                color="success.main"
                variant="caption"
                fontSize="1.5rem"
              >
                {filteredData.utilizedHours} /{' '}
                {filteredData.totalHours || '-/-'}
              </Typography>
            )}
          </Stack>
          <Stack className={styles.labelContainer}>
            <Typography
              variant="caption"
              fontSize="0.75rem"
              color="text.caption"
            >
              Idle
              <Typography component="span" variant="caption" fontSize="0.6rem">
                &nbsp;(Hours)
              </Typography>
            </Typography>
            {deviceUsageDaily?.totalDevices && (
              <Typography color="info.main" variant="caption" fontSize="1.5rem">
                {filteredData.idleHours} / {filteredData.totalHours}
              </Typography>
            )}
          </Stack>
        </Stack>
        <Stack alignItems="center" justifyContent="flex-end" flex="1">
          <PieChart width={160} height={160}>
            <Pie
              data={filteredData.data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={80}
              dataKey="value"
              label={(props) => <CustomLabel {...props} fontSize={12} />}
              isAnimationActive={true}
              labelLine={false}
              paddingAngle={0}
              stroke="none"
              // activeIndex removed in Recharts v3
            />
          </PieChart>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default DeviceUsagePiePanel;
