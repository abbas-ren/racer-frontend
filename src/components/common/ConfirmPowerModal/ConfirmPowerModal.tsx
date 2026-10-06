import { Box, Stack, Button, Typography, Dialog } from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './ConfirmPowerModal.module.scss';
import clsx from 'clsx';

export interface ConfirmPowerModalProps {
  open: boolean;
  deviceName?: string;
  isPowerOn?: boolean; // true = currently ON (will turn OFF), false = currently OFF (will turn ON)
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmPowerModal = ({
  open,
  deviceName,
  isPowerOn = false,
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmPowerModalProps) => {
  if (!open) return null;

  // If currently ON, we're turning OFF (and vice versa)
  const isTurningOff = isPowerOn === true;
  const title = isTurningOff ? 'Confirm Power OFF' : 'Confirm Power ON';
  const subtitle = `Device: ${deviceName ?? ''}`;
  const message = isTurningOff
    ? `Are you sure you want to turn the power OFF for ${deviceName ?? 'this device'}?`
    : `Are you sure you want to turn the power ON for ${deviceName ?? 'this device'}?`;
  const actionText = isTurningOff ? 'Power OFF' : 'Power ON';

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth={false}
      PaperProps={{
        className: styles.modal,
      }}
    >
      <Box>
        <Box className={styles.header}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Stack
              className={clsx(styles.iconWrap, [
                isTurningOff ? styles.iconWrapError : styles.iconWrapSuccess,
              ])}
            >
              <CustomIcon
                name="power"
                size={22.5}
                color={
                  isTurningOff
                    ? 'var(--mui-palette-error-main)'
                    : 'var(--mui-palette-success-main)'
                }
              />
            </Stack>
            <Stack>
              <Typography className={styles.title} variant="body1">
                {title}
              </Typography>
              <Typography className={styles.subtitle} variant="caption">
                {subtitle}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Box className={styles.body}>
          <Typography className={styles.message} variant="body2">
            {message}
          </Typography>
        </Box>

        <Box className={styles.footer}>
          <Button
            className={styles.btnCancel}
            onClick={onCancel}
            variant="outlined"
            disabled={loading}
          >
            <Typography variant="button2">Cancel</Typography>
          </Button>
          <Button
            className={isTurningOff ? styles.btnDanger : styles.btnSuccess}
            onClick={onConfirm}
            disabled={loading}
          >
            <Typography variant="button2">{actionText}</Typography>
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ConfirmPowerModal;
