import { Stack, IconButton, Tooltip, CircularProgress } from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import {
  Terminal,
  TerminalDisabled,
  TreeRtosDisabledIcon,
  TreeRtosIcon,
} from 'assets/index';
import { DeviceState } from 'typesCustom/components';
import type { DevicePower } from 'typesCustom/types';

interface DeviceActionButtonsProps {
  deviceId: string;
  deviceName?: string;
  deviceType?: string;
  deviceState?: string;
  devicePower?: DevicePower;
  selectedDeviceId: string | null;
  terminalTarget: string | null;
  powerToggleLoading: boolean;
  deleteLoading?: boolean;
  onSshTerminalOpen: (deviceId: string) => void;
  onRtosTerminalOpen: (deviceId: string) => void;
  onPowerToggle: (
    deviceId: string,
    deviceName: string,
    isPowerOn: boolean,
  ) => void;
  onDelete?: (deviceId: string, deviceName: string) => void;
}

function DeviceActionButtons({
  deviceId,
  deviceName,
  deviceType,
  deviceState,
  devicePower,
  selectedDeviceId,
  terminalTarget,
  powerToggleLoading,
  deleteLoading = false,
  onSshTerminalOpen,
  onRtosTerminalOpen,
  onPowerToggle,
  onDelete,
}: DeviceActionButtonsProps) {
  const isFaulty =
    deviceState === DeviceState.FAULTY ||
    deviceState === DeviceState.NOT_REACHABLE;
  const isTerminalSelected = selectedDeviceId === deviceId;
  const isTerminalOpen = !!terminalTarget;
  const deviceSignature =
    `${deviceType ?? ''} ${deviceName ?? ''}`.toLowerCase();
  const isGen3Device =
    deviceSignature.includes('gen3') ||
    deviceSignature.includes('Gen3') ||
    deviceSignature.includes('gen 3') ||
    deviceSignature.includes('x3h') ||
    deviceSignature.includes('m3-n') ||
    deviceSignature.includes('h3');
  const isPoweredOff = devicePower === 'off';
  const canOpenTerminal =
    !isFaulty && !isPoweredOff && (!isTerminalOpen || isTerminalSelected);
  const showDisabledTerminalIcon = !canOpenTerminal;
  const isPowerOn = devicePower === 'on';
  const gen3UnavailableTooltip = 'These are unavailable for Gen3 devices.';

  return (
    <Stack
      direction="row"
      justifyContent="center"
      sx={{
        width: '100%',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        columnGap: { xs: 0.25, sm: 0.5 },
        rowGap: { xs: 0.25, sm: 0.5 },
      }}
    >
      <IconButton
        size="small"
        sx={{ p: { xs: 0.2, sm: 0.3 } }}
        disabled={!canOpenTerminal}
        onClick={() => onSshTerminalOpen(deviceId)}
        title={
          isPoweredOff
            ? 'Power ON the device to open terminal'
            : isTerminalOpen && !isTerminalSelected
              ? 'Close current terminal first'
              : 'Open SSH Terminal'
        }
      >
        {showDisabledTerminalIcon ? <TerminalDisabled /> : <Terminal />}
      </IconButton>
      {isGen3Device ? (
        <Tooltip title={gen3UnavailableTooltip}>
          <span>
            <IconButton size="small" sx={{ p: { xs: 0.2, sm: 0.3 } }} disabled>
              <img
                src={TreeRtosDisabledIcon}
                alt="RTOS disabled"
                width={18}
                height={18}
              />
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <IconButton
          size="small"
          sx={{ p: { xs: 0.2, sm: 0.3 } }}
          disabled={!canOpenTerminal}
          onClick={() => onRtosTerminalOpen(deviceId)}
          title={
            isPoweredOff
              ? 'Power ON the device to open terminal'
              : isTerminalOpen && !isTerminalSelected
                ? 'Close current terminal first'
                : 'Open RTOS Terminal'
          }
        >
          {showDisabledTerminalIcon ? (
            <img
              src={TreeRtosDisabledIcon}
              alt="RTOS disabled"
              width={18}
              height={18}
            />
          ) : (
            <img src={TreeRtosIcon} alt="RTOS" width={18} height={18} />
          )}
        </IconButton>
      )}
      {isGen3Device ? (
        <Tooltip title={gen3UnavailableTooltip}>
          <span>
            <IconButton
              size="small"
              sx={{
                p: { xs: 0.2, sm: 0.3 },
                color: 'action.disabled',
              }}
              disabled
            >
              <PowerSettingsNewIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <IconButton
          size="small"
          sx={{
            p: { xs: 0.2, sm: 0.3 },
            color: isPowerOn ? 'error.main' : 'success.main',
          }}
          disabled={powerToggleLoading}
          onClick={() =>
            onPowerToggle(deviceId, deviceName ?? deviceId, isPowerOn)
          }
          title={
            isPowerOn
              ? 'Power ON - Click to turn OFF'
              : 'Power OFF - Click to turn ON'
          }
        >
          <PowerSettingsNewIcon fontSize="small" />
        </IconButton>
      )}
      {onDelete && (
        <IconButton
          size="small"
          sx={{ p: { xs: 0.2, sm: 0.3 }, color: 'error.main' }}
          disabled={deleteLoading}
          onClick={() => onDelete(deviceId, deviceName ?? deviceId)}
          title="Delete Device"
        >
          {deleteLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <CustomIcon name="trash-2" size={16} />
          )}
        </IconButton>
      )}
    </Stack>
  );
}

export default DeviceActionButtons;
