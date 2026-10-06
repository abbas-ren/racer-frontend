import { memo } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Typography,
} from '@mui/material';
import styles from './DeleteControllerDialog.module.scss';

interface DeleteControllerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  controllerId?: string;
  isSaving?: boolean;
}

const DeleteControllerDialog = ({
  open,
  onClose,
  onSubmit,
  controllerId,
  isSaving = false,
}: DeleteControllerDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
                Delete Device Controller
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                className={styles.subtitle}
              >
                Controller: {controllerId ?? '-'}
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
            This will delete the device controller and all its relays. This
            action cannot be undone.
          </Typography>
        </Box>

        <Box className={styles.footer}>
          <Button
            variant="outlined"
            onClick={onClose}
            className={styles.footerButton}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onSubmit}
            className={styles.footerButton}
            disabled={isSaving}
            startIcon={
              isSaving ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isSaving ? 'Deleting...' : 'Delete Controller'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default memo(DeleteControllerDialog);
