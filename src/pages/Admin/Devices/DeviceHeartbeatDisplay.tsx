import React, { useState, useEffect } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { TableActionIc } from 'assets/index';
import ConfigureDeviceDialog from 'components/ConfigureDeviceDialog/ConfigureDeviceDialog';
import { useDispatch } from 'react-redux';
import { setDeviceHeartbeatStatus, updateDeviceTimer } from 'store/slices';
import { DeleteConfirmDialog } from 'components/Dialogs/ConfirmDialog';
import { IDevice } from 'typesCustom/types';
import useTableRowUtility from 'components/Dashboard/DeviceDetailsTable/Table/useTableRowUtility';
import HeartbeatTimerIndicator from './HeartbeatTimerIndicator';

interface DeviceHeartbeatDisplayProps {
  seconds: number;
  hasHeartbeat: boolean;
  device: IDevice;
  heartbeatTimeout: number;
}

const ITEM_HEIGHT = 48;
const deviceOptions = ['Delete Device', 'Lock Device', 'Configure Heartbeat'];

const DeviceHeartbeatDisplay: React.FC<DeviceHeartbeatDisplayProps> = ({
  seconds,
  hasHeartbeat,
  device,
  heartbeatTimeout,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [configureDialogOpen, setConfigureDialogOpen] =
    useState<boolean>(false);
  const open = Boolean(anchorEl);
  const { deleteDevice, saveHeartbeatTimeout } = useTableRowUtility();
  const dispatch = useDispatch();

  useEffect(() => {
    if (seconds > heartbeatTimeout) {
      dispatch(
        setDeviceHeartbeatStatus({ deviceId: device.deviceId, status: false }),
      );
    }
    dispatch(updateDeviceTimer({ deviceId: device.deviceId, timer: seconds }));
  }, [seconds, heartbeatTimeout, device, dispatch]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenConfirmDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConfirmDelete = (force = false) => {
    deleteDevice(device.deviceId, force);
    setIsDialogOpen(false);
  };

  const handleMenuItemClick = (option: string) => {
    if (option === 'Delete Device') {
      handleOpenConfirmDialog();
    }
    if (option === 'Configure Heartbeat') {
      handleConfigureDialogOpen();
    }
    setAnchorEl(null);
  };

  const handleConfigureDialogOpen = () => {
    setConfigureDialogOpen(true);
  };

  const handleConfigureDialogClose = () => {
    setConfigureDialogOpen(false);
  };

  const handleHeartbeatTimeout = (value: number) => {
    saveHeartbeatTimeout(device.deviceId, value);
  };

  return (
    <div className="flex flex-gap-sm flex-between">
      <HeartbeatTimerIndicator
        seconds={seconds}
        hasHeartbeat={hasHeartbeat}
        heartbeatTimeout={heartbeatTimeout}
        state={device.state}
        size={42}
        strokeWidth={6}
      />
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <img src={TableActionIc} alt="Action" />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              width: '20ch',
            },
          },
          list: {
            'aria-labelledby': 'long-button',
          },
        }}
      >
        {deviceOptions.map((option) => (
          <MenuItem key={option} onClick={() => handleMenuItemClick(option)}>
            {option}
          </MenuItem>
        ))}
      </Menu>
      <ConfigureDeviceDialog
        open={configureDialogOpen}
        handleClose={handleConfigureDialogClose}
        defValue={heartbeatTimeout}
        onSave={handleHeartbeatTimeout}
        initialValue={heartbeatTimeout}
      />
      {device && (
        <DeleteConfirmDialog
          isOpen={isDialogOpen}
          onClose={handleCloseConfirmDialog}
          onConfirm={handleConfirmDelete}
          resourceName={'Device'}
          resourceId={device.deviceId}
          allowForceDelete={!hasHeartbeat || seconds > heartbeatTimeout}
        />
      )}
    </div>
  );
};

export default DeviceHeartbeatDisplay;
