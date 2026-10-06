import { Box } from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import CardHeader from './CardHeader';
import { composeDashboardClasses } from '../styles/dashboardStyles';
import { fetchDeviceByFamiliesRequest, RootState } from 'store/index';
import { useAlertSocket } from 'hooks/useAlertSocket';
import { AlertData } from 'services/wsClient';
import { getDeviceStateColor } from 'utils/dashboard';
import type { DeviceState } from 'typesCustom/components';

const DeviceFamiliesCard = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    dispatch(fetchDeviceByFamiliesRequest());
  }, [dispatch]);

  useAlertSocket((alert: AlertData) => {
    if (
      alert.subtype === 'device-approval' ||
      alert.subtype === 'device-state-change' ||
      alert.subtype === 'device-deletion'
    ) {
      dispatch(fetchDeviceByFamiliesRequest());
    }
  });

  const families = useSelector(
    (state: RootState) => state.dashboard.deviceFamilies,
  );

  return (
    <div className={composeDashboardClasses('card')}>
      <CardHeader icon={Box} title="Device Families" />
      <div className={composeDashboardClasses('device-families-container')}>
        {families.map((family, idx) => (
          <div
            key={`${family.generation}-${idx}`}
            className={composeDashboardClasses('family-group')}
          >
            <div className={composeDashboardClasses('family-header')}>
              <span>{family.generation}</span>
              <span className={composeDashboardClasses('family-badge')}>
                • {family.deviceCount} devices
              </span>
            </div>
            <div className={composeDashboardClasses('family-devices-grid')}>
              {family.devices.map((device, i) => {
                const deviceStateColor = getDeviceStateColor({
                  type: device.state as DeviceState,
                  theme,
                });
                const bgColor = `${deviceStateColor}15`;

                return (
                  <div
                    key={`${device.deviceId}-${i}`}
                    className={composeDashboardClasses('family-device-tag')}
                    style={{
                      backgroundColor: bgColor,
                      color: deviceStateColor,
                    }}
                  >
                    <span className={composeDashboardClasses('fd-label')}>
                      {device.deviceType} -{' '}
                    </span>
                    <span className={composeDashboardClasses('fd-id')}>
                      {device.deviceId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceFamiliesCard;
