import { memo, useCallback, useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type {
  ChannelHardwareAssignment,
  RelayDeviceOption,
  SelectedRelayContext,
} from 'types/configuration';
import type {
  RelayIdentityUpdatePayload,
  RelayIdentityUpdateResponse,
} from 'types/deviceController';
import type { EdgeGpioHeaderProfile } from 'types/adminControl';
import styles from './ConfigureRelayDialog.module.scss';

interface ConfigureRelayDialogProps {
  open: boolean;
  onClose: () => void;
  selectedRelayContext: SelectedRelayContext | null;
  channelAssignments: Record<number, string>;
  channelHardwareAssignments: Record<number, ChannelHardwareAssignment>;
  assignedDevices: Record<number, RelayDeviceOption | null>;
  onChannelChange: (channel: number, value: string) => void;
  onChannelHardwareChange: (
    channel: number,
    field: keyof ChannelHardwareAssignment,
    value: string,
  ) => void;
  onRelayIdentityUpdate: (
    payload: RelayIdentityUpdatePayload,
  ) => Promise<RelayIdentityUpdateResponse>;
  onResetAll: () => void;
  onSave: () => void;
  onConfigureUart: (channel: number, device: RelayDeviceOption) => void;
  channelValueOptions: RelayDeviceOption[];
  isSaving?: boolean;
  isSyncingHardware?: boolean;
  hardwareConfirmed?: boolean;
  isLoading?: boolean;
  isLoadingMoreDevices?: boolean;
  hasMoreDevices?: boolean;
  onLoadMoreDevices?: () => void;
  hasChanges?: boolean;
  gpioHeaderProfile: EdgeGpioHeaderProfile | null;
}

const compactSelectSx = {
  height: 38,
  borderRadius: '8px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'grey.300',
  },
  '& .MuiSelect-select': {
    fontSize: 13,
    fontWeight: 400,
    fontFamily: 'var(--mui-font-family)',
  },
};

const legacyGpioOptions = Array.from({ length: 25 }, (_, index) =>
  String(index + 2),
);

const ConfigureRelayDialog = ({
  open,
  onClose,
  selectedRelayContext,
  channelAssignments,
  channelHardwareAssignments,
  assignedDevices,
  onChannelChange,
  onChannelHardwareChange,
  onRelayIdentityUpdate,
  onResetAll,
  onSave,
  onConfigureUart,
  channelValueOptions,
  isSaving = false,
  isSyncingHardware = false,
  hardwareConfirmed = false,
  isLoading = false,
  isLoadingMoreDevices = false,
  hasMoreDevices = false,
  onLoadMoreDevices,
  hasChanges = false,
  gpioHeaderProfile,
}: ConfigureRelayDialogProps) => {
  const menuListRef = useRef<HTMLUListElement | null>(null);
  // Track which channel cards have the GPIO section expanded.
  // Driven by explicit per-channel user interaction, NOT by global channelAssignments,
  // so that selecting a device on one card never expands a different card.
  const [expandedChannels, setExpandedChannels] = useState<
    Record<number, boolean>
  >(() =>
    Object.fromEntries(
      Object.entries(channelAssignments).map(([ch, val]) => [
        Number(ch),
        !!val,
      ]),
    ),
  );
  const [relaySerialNumber, setRelaySerialNumber] = useState('');
  const [relayVidPid, setRelayVidPid] = useState('');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState('');
  const hasMissingGpio = Object.entries(channelAssignments).some(
    ([channel, deviceId]) =>
      Boolean(deviceId) &&
      !channelHardwareAssignments[Number(channel)]?.gpio.trim(),
  );

  // Re-initialise when the dialog opens (new relay context loaded)
  useEffect(() => {
    if (open) {
      setRelaySerialNumber(selectedRelayContext?.relay.serialNo ?? '');
      setRelayVidPid(selectedRelayContext?.relay.vidPid ?? '');
      setIdentityError('');
      setExpandedChannels(
        Object.fromEntries(
          Object.entries(channelAssignments).map(([ch, val]) => [
            Number(ch),
            !!val,
          ]),
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleIdentitySave = useCallback(async () => {
    const serialNumber = relaySerialNumber.trim();
    const vidPid = relayVidPid.trim().toUpperCase();
    if (!vidPid) {
      setIdentityError('VID:PID is required. Serial number is optional.');
      return;
    }
    if (vidPid && !/^[0-9A-F]{4}:[0-9A-F]{4}$/.test(vidPid)) {
      setIdentityError('VID:PID must use hexadecimal XXXX:XXXX format.');
      return;
    }

    setIdentityError('');
    setIsSavingIdentity(true);
    try {
      const updated = await onRelayIdentityUpdate({
        serialNumber: serialNumber || undefined,
        vidPid,
      });
      setRelaySerialNumber(updated.serialNumber);
      setRelayVidPid(updated.vidPid);
    } catch {
      setIdentityError('Relay identity update failed.');
    } finally {
      setIsSavingIdentity(false);
    }
  }, [onRelayIdentityUpdate, relaySerialNumber, relayVidPid]);

  // Collapse a card when its assignment is externally cleared (e.g. Reset All).
  // Never expand a card automatically — only explicit user selection does that.
  useEffect(() => {
    setExpandedChannels((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.entries(channelAssignments).forEach(([ch, val]) => {
        const chNum = Number(ch);
        if (!val && next[chNum]) {
          next[chNum] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [channelAssignments]);

  const handleChannelSelect = useCallback(
    (channelNumber: number, value: string) => {
      // Expand only the card the user just interacted with
      setExpandedChannels((prev) => ({ ...prev, [channelNumber]: !!value }));
      onChannelChange(channelNumber, value);
    },
    [onChannelChange],
  );

  const getAvailableOptionsForChannel = useCallback(
    (currentChannelIndex: number): RelayDeviceOption[] => {
      // Get all device IDs that are currently selected in OTHER channels
      const selectedDeviceIds = new Set<string>();
      Object.entries(channelAssignments).forEach(([channelKey, deviceId]) => {
        if (deviceId && Number(channelKey) !== currentChannelIndex) {
          selectedDeviceIds.add(deviceId);
        }
      });

      // Simple filtering: exclude devices selected in other channels
      // All available devices come from channelValueOptions (paginated list from backend)
      const availableOptions = channelValueOptions.filter(
        (option) => !selectedDeviceIds.has(option.deviceId),
      );

      return availableOptions;
    },
    [channelAssignments, channelValueOptions],
  );

  const handleMenuScroll = useCallback(
    (event: React.UIEvent<HTMLUListElement>) => {
      const target = event.target as HTMLUListElement;
      const scrollThreshold = 50;
      const isNearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight <
        scrollThreshold;

      if (isNearBottom && hasMoreDevices && !isLoadingMoreDevices) {
        onLoadMoreDevices?.();
      }
    },
    [hasMoreDevices, isLoadingMoreDevices, onLoadMoreDevices],
  );

  const gpioLabel = useCallback(
    (lineOffset: string) => {
      const pin = gpioHeaderProfile?.pins.find(
        (candidate) => String(candidate.lineOffset) === lineOffset,
      );
      return pin
        ? `Physical pin ${pin.physicalPin} (GPIO${pin.lineOffset})`
        : lineOffset
          ? `GPIO line ${lineOffset}`
          : 'None';
    },
    [gpioHeaderProfile],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { className: styles.dialogPaper },
        backdrop: { className: styles.dialogBackdrop },
      }}
    >
      <DialogContent className={styles.dialogContent}>
        <Box className={styles.header}>
          <Stack
            className={styles.headerRow}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="subtitle1" className={styles.title}>
                Configure Relay Channels
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                className={styles.subtitle}
              >
                {selectedRelayContext?.relay.serialNo ?? '-'} •{' '}
                {selectedRelayContext?.relay.channels ?? 0} Channels
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Box className={styles.body}>
          <Box className={styles.identityPanel}>
            <Typography variant="subtitle2" className={styles.identityTitle}>
              Relay identity
            </Typography>
            <Box className={styles.identityFields}>
              <TextField
                label="Serial number"
                size="small"
                value={relaySerialNumber}
                onChange={(event) => setRelaySerialNumber(event.target.value)}
                disabled={isSavingIdentity || isSyncingHardware}
              />
              <TextField
                label="VID:PID"
                size="small"
                value={relayVidPid}
                placeholder="0403:6001"
                onChange={(event) => setRelayVidPid(event.target.value)}
                error={Boolean(identityError)}
                helperText={identityError || ' '}
                disabled={isSavingIdentity || isSyncingHardware}
              />
              <Button
                variant="outlined"
                onClick={handleIdentitySave}
                disabled={isSavingIdentity || isSyncingHardware}
                startIcon={
                  isSavingIdentity ? <CircularProgress size={16} /> : null
                }
              >
                {isSavingIdentity ? 'Updating...' : 'Update identity'}
              </Button>
            </Box>
          </Box>

          {isLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight={200}
            >
              <CircularProgress size={32} />
            </Box>
          ) : (
            <div className={styles.channelGrid}>
              {isSyncingHardware ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    Waiting for relay and GPIO confirmation...
                  </Typography>
                </Stack>
              ) : null}
              {Array.from({
                length: selectedRelayContext?.relay.channels ?? 0,
              }).map((_, index) => {
                const channelNumber = index; // Use 0-based index to match backend
                const channelDisplay = index + 1; // Display as 0-based to match backend
                const availableOptions =
                  getAvailableOptionsForChannel(channelNumber);
                const currentValue = channelAssignments[channelNumber] ?? '';
                const currentHardware = channelHardwareAssignments[
                  channelNumber
                ] ?? {
                  gpio: '',
                  gpioDefaultLevel: 'LOW',
                  relayDefaultLevel: 'LOW',
                };

                // Find current option - check paginated list first, then assignedDevices
                let currentOption: RelayDeviceOption | null = null;
                if (currentValue) {
                  currentOption =
                    channelValueOptions.find(
                      (opt) => opt.deviceId === currentValue,
                    ) ??
                    assignedDevices[channelNumber] ??
                    null;
                }

                return (
                  <Box key={channelNumber} className={styles.channelCard}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      className={styles.channelLabel}
                    >
                      Channel {channelDisplay}
                    </Typography>

                    <Select
                      fullWidth
                      size="small"
                      sx={compactSelectSx}
                      value={currentValue}
                      onChange={(event) =>
                        handleChannelSelect(channelNumber, event.target.value)
                      }
                      MenuProps={{
                        PaperProps: {
                          style: { maxHeight: 250 },
                        },
                        MenuListProps: {
                          ref: menuListRef,
                          onScroll: handleMenuScroll,
                        },
                      }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {currentOption && currentValue && (
                        <MenuItem
                          key={currentOption.deviceId}
                          value={currentOption.deviceId}
                        >
                          {currentOption.deviceType} -{' '}
                          {currentOption.macAddress}
                        </MenuItem>
                      )}
                      {availableOptions
                        .filter((opt) => opt.deviceId !== currentValue)
                        .map((option) => (
                          <MenuItem
                            key={option.deviceId}
                            value={option.deviceId}
                          >
                            {option.deviceType} - {option.macAddress}
                          </MenuItem>
                        ))}
                      {isLoadingMoreDevices && (
                        <MenuItem disabled>
                          <Box
                            display="flex"
                            justifyContent="center"
                            width="100%"
                          >
                            <CircularProgress size={20} />
                          </Box>
                        </MenuItem>
                      )}
                    </Select>

                    {currentValue && currentOption ? (
                      <Box className={styles.assignmentSummary}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          className={styles.assignmentSummaryText}
                        >
                          {currentOption.deviceType} -{' '}
                          {currentOption.macAddress}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          className={styles.gpioSummaryText}
                        >
                          {gpioLabel(currentHardware.gpio)} • Default:{' '}
                          {currentHardware.gpioDefaultLevel} • Relay default:{' '}
                          {currentHardware.relayDefaultLevel}
                        </Typography>
                      </Box>
                    ) : null}

                    {expandedChannels[channelNumber] ? (
                      <Box className={styles.gpioRow}>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            className={styles.channelLabel}
                          >
                            {gpioHeaderProfile
                              ? `Raspberry Pi ${gpioHeaderProfile.model} header pin`
                              : 'GPIO line'}
                          </Typography>
                          <Select
                            fullWidth
                            size="small"
                            sx={compactSelectSx}
                            value={currentHardware.gpio}
                            onChange={(event) =>
                              onChannelHardwareChange(
                                channelNumber,
                                'gpio',
                                event.target.value,
                              )
                            }
                          >
                            <MenuItem value="">None</MenuItem>
                            {gpioHeaderProfile?.pins.map((pin) => (
                              <MenuItem
                                key={`gpio-${channelNumber}-${pin.physicalPin}`}
                                value={String(pin.lineOffset)}
                              >
                                Physical pin {pin.physicalPin} (GPIO
                                {pin.lineOffset})
                              </MenuItem>
                            ))}
                            {!gpioHeaderProfile &&
                              legacyGpioOptions.map((gpioValue) => (
                                <MenuItem
                                  key={`gpio-${channelNumber}-${gpioValue}`}
                                  value={gpioValue}
                                >
                                  GPIO line {gpioValue}
                                </MenuItem>
                              ))}
                          </Select>
                        </Box>

                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            className={styles.channelLabel}
                          >
                            GPIO default level
                          </Typography>
                          <Select
                            fullWidth
                            size="small"
                            sx={compactSelectSx}
                            value={currentHardware.gpioDefaultLevel}
                            onChange={(event) =>
                              onChannelHardwareChange(
                                channelNumber,
                                'gpioDefaultLevel',
                                event.target.value,
                              )
                            }
                          >
                            <MenuItem value="HIGH">HIGH</MenuItem>
                            <MenuItem value="LOW">LOW</MenuItem>
                          </Select>
                          <Typography variant="caption" color="text.secondary">
                            Download:{' '}
                            {currentHardware.gpioDefaultLevel === 'HIGH'
                              ? 'LOW'
                              : 'HIGH'}
                          </Typography>
                        </Box>

                        <Box display="flex" alignItems="end">
                          <Button
                            variant="outlined"
                            fullWidth
                            disabled={
                              !hardwareConfirmed ||
                              isSyncingHardware ||
                              !currentOption
                            }
                            onClick={() => {
                              if (currentOption) {
                                onConfigureUart(channelNumber, currentOption);
                              }
                            }}
                          >
                            Verify UART
                          </Button>
                        </Box>

                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            className={styles.channelLabel}
                          >
                            Relay default level
                          </Typography>
                          <Select
                            fullWidth
                            size="small"
                            sx={compactSelectSx}
                            value={currentHardware.relayDefaultLevel}
                            onChange={(event) =>
                              onChannelHardwareChange(
                                channelNumber,
                                'relayDefaultLevel',
                                event.target.value,
                              )
                            }
                          >
                            <MenuItem value="HIGH">HIGH</MenuItem>
                            <MenuItem value="LOW">LOW</MenuItem>
                          </Select>
                          <Typography variant="caption" color="text.secondary">
                            Download:{' '}
                            {currentHardware.relayDefaultLevel === 'HIGH'
                              ? 'LOW'
                              : 'HIGH'}
                          </Typography>
                        </Box>
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
              {hasMissingGpio ? (
                <Typography color="error" variant="caption">
                  Select a GPIO pin for every assigned channel.
                </Typography>
              ) : null}
            </div>
          )}
        </Box>
        <Box className={styles.footer}>
          <Button
            variant="text"
            onClick={onResetAll}
            className={styles.resetButton}
            disabled={isSaving || isSyncingHardware || isLoading}
          >
            Reset All
          </Button>

          <div className={styles.footerRight}>
            <Button
              variant="text"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={onSave}
              className={styles.saveButton}
              disabled={
                isSaving ||
                isSyncingHardware ||
                isLoading ||
                !hasChanges ||
                hasMissingGpio
              }
              startIcon={
                isSaving ? <CircularProgress size={16} color="inherit" /> : null
              }
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default memo(ConfigureRelayDialog);
