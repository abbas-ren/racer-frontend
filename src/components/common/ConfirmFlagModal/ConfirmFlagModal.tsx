import { Box, Stack, Button, Typography, Dialog } from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './ConfirmFlagModal.module.scss';
import clsx from 'clsx';

export interface ConfirmFlagModalProps {
  open: boolean;
  buildVersion?: string;
  nextFlag?: boolean; // true to flag, false to unflag
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmFlagModal = ({
  open,
  buildVersion,
  nextFlag = true,
  onCancel,
  onConfirm,
}: ConfirmFlagModalProps) => {
  if (!open) return null;

  const isFlagging = nextFlag === true;
  const title = isFlagging ? 'Flag Build' : 'Unflag Build';
  const subtitle = `Build: ${buildVersion ?? ''}`;
  const message = isFlagging
    ? 'Are you sure you want to flag this build?'
    : 'Are you sure you want to unflag this build?';

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
                isFlagging ? styles.iconWrapError : styles.iconWrapSuccess,
              ])}
            >
              <CustomIcon
                name="flag"
                size={22.5}
                color={
                  isFlagging
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
          <Typography className={styles.message} variant="body3">
            {message}
          </Typography>
        </Box>

        <Box className={styles.footer}>
          <Button
            className={styles.btnCancel}
            onClick={onCancel}
            variant="outlined"
          >
            <Typography variant="button2">Cancel</Typography>
          </Button>
          <Button
            className={isFlagging ? styles.btnDanger : styles.btnSuccess}
            onClick={onConfirm}
          >
            <Typography variant="button2">
              {isFlagging ? 'Flag Build' : 'Unflag Build'}
            </Typography>
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ConfirmFlagModal;
