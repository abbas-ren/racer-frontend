import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import styles from './ConfimDialogStyle.module.scss';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (force?: boolean) => void;
  resourceName: string;
  resourceId: string;
  allowForceDelete?: boolean;
}

export const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  resourceName,
  resourceId,
  allowForceDelete = false,
}: DeleteConfirmDialogProps) => {
  const [forceDelete, setForceDelete] = useState(false);

  if (!isOpen) return null;

  const close = () => {
    setForceDelete(false);
    onClose();
  };

  const confirm = () => {
    onConfirm(allowForceDelete && forceDelete);
    setForceDelete(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { className: styles.dialogPaper },
        backdrop: { className: styles.dialogBackdrop },
      }}
    >
      <DialogContent className={styles.dialogContent}>
        <Box className={styles.header}>
          <div className={styles.headerRow}>
            <Box className={styles.iconCircle}>
              <DeleteOutlineIcon className={styles.icon} />
            </Box>
            <Box>
              <Typography variant="subtitle1" className={styles.title}>
                Delete {resourceName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                className={styles.subtitle}
              >
                {resourceName}: {resourceId}
              </Typography>
            </Box>
          </div>
        </Box>

        <Box className={styles.body}>
          <Typography
            variant="body2"
            color="text.secondary"
            className={styles.bodyText}
          >
            This will delete the {resourceName.toLowerCase()}. This action
            cannot be undone.
          </Typography>
          {allowForceDelete && (
            <Alert severity="warning">
              The device is offline and cannot clear its local approval state.
              <FormControlLabel
                control={
                  <Checkbox
                    checked={forceDelete}
                    onChange={(event) => setForceDelete(event.target.checked)}
                  />
                }
                label="Force removal from FarmController persistence"
              />
            </Alert>
          )}
        </Box>

        <Box className={styles.footer}>
          <Button
            variant="outlined"
            onClick={close}
            className={styles.footerButton}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirm}
            disabled={allowForceDelete && !forceDelete}
            className={styles.footerButton}
          >
            Delete {resourceName}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
