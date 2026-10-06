import React from 'react';
import Dialog from '@mui/material/Dialog';
import CustomIcon from '../CustomIcon/CustomIcon';
import styles from './ConfirmDeleteModal.module.scss';
import { Button, Stack, Typography } from '@mui/material';

interface ConfirmDeleteModalProps {
  open: boolean;
  buildVersion: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  buildVersion,
  onCancel,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      slotProps={{
        paper: {
          className: styles.modal,
        },
      }}
      maxWidth={false}
    >
      <Stack className={styles.header}>
        <div className={styles.headerRow}>
          <Stack className={styles.iconWrapError}>
            <CustomIcon
              name="trash-2"
              size={20}
              color="var(--mui-palette-error-main)"
            />
          </Stack>
          <Stack>
            <Typography className={styles.title} variant="subtitle2">
              Delete Build
            </Typography>
            <Typography className={styles.subtitle} variant="body3">
              {buildVersion}
            </Typography>
          </Stack>
        </div>
      </Stack>
      <Stack className={styles.body}>
        <Typography className={styles.message} variant="body3">
          Are you absolutely sure? This action cannot be undone. This will
          permanently delete the build and all associated data.
        </Typography>
      </Stack>
      <Stack className={styles.footer} direction="row" spacing={2}>
        <Button
          className={styles.btnCancel}
          onClick={onCancel}
          variant="outlined"
        >
          <Typography variant="button2">Cancel</Typography>
        </Button>
        <Button className={styles.btnDanger} onClick={onConfirm}>
          <Typography variant="button2">Delete Build</Typography>
        </Button>
      </Stack>
    </Dialog>
  );
};
