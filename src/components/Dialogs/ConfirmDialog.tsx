import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import styles from './ConfimDialogStyle.module.scss';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  resourceName: string;
  resourceId: string;
}

export const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  resourceName,
  resourceId,
}: DeleteConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
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
        </Box>

        <Box className={styles.footer}>
          <Button
            variant="outlined"
            onClick={onClose}
            className={styles.footerButton}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={onConfirm}
            className={styles.footerButton}
          >
            Delete {resourceName}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
