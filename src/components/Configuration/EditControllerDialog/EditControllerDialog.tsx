import { memo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { isGen5Generation } from 'constants/configuration';
import type { EditControllerForm } from 'types/configuration';
import styles from './EditControllerDialog.module.scss';

interface EditControllerDialogProps {
  open: boolean;
  onClose: () => void;
  editForm: EditControllerForm;
  onFormChange: (field: keyof EditControllerForm, value: string) => void;
  onSubmit: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
}

const compactFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 34,
    borderRadius: '8px',
    '& input': {
      fontSize: 12,
      fontFamily: 'var(--mui-font-family)',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'grey.300',
    },
  },
};

const EditControllerDialog = ({
  open,
  onClose,
  editForm,
  onFormChange,
  onSubmit,
  isSaving = false,
  hasChanges = false,
}: EditControllerDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: { className: styles.dialogPaper },
        backdrop: { className: styles.dialogBackdrop },
      }}
    >
      <DialogContent className={styles.dialogContent}>
        <Box className={styles.header}>
          <div className={styles.headerRow}>
            <Box>
              <Typography variant="h6" className={styles.title}>
                Edit Device Controller
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                className={styles.subtitle}
              >
                Update the device controller details below.
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        </Box>

        <Box className={styles.formBody}>
          <div className={styles.formStack}>
            <Box>
              <Typography variant="body2" className={styles.fieldLabel}>
                Controller Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                sx={compactFieldSx}
                value={editForm.controllerName}
                onChange={(event) =>
                  onFormChange('controllerName', event.target.value)
                }
              />
              <Box className={styles.chipRow}>
                <Chip
                  label={editForm.ipAddress}
                  size="small"
                  variant="outlined"
                  className={styles.infoChip}
                />
                <Chip
                  label={editForm.generation}
                  size="small"
                  variant="outlined"
                  className={styles.infoChip}
                />
              </Box>

              {/* {isGen5Generation(editForm.generation) && (
                <Box className={styles.gen5Warning}>
                  <WarningAmberRoundedIcon className={styles.warningIcon} />
                  <Typography className={styles.warningText}>
                    Gen 5 controllers do not support relay configuration. Any
                    existing relays will be hidden.
                  </Typography>
                </Box>
              )} */}
            </Box>
          </div>
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
            variant="contained"
            onClick={onSubmit}
            className={styles.footerButton}
            disabled={isSaving || !hasChanges}
            startIcon={
              isSaving ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isSaving ? 'Updating...' : 'Update Controller'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default memo(EditControllerDialog);
