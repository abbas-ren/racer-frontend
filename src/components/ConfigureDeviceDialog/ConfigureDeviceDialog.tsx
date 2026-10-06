import * as React from 'react';
import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import styles from './ConfigureDeviceDialog.module.scss';
import { Button } from 'components/common';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ConfigureDeviceDialogProps {
  open: boolean;
  handleClose: () => void;
  initialValue: number;
  onSave?: (value: number) => void;
  defValue?: number;
}

export default function ConfigureDeviceDialog({
  open,
  handleClose,
  initialValue,
  onSave,
  defValue,
}: ConfigureDeviceDialogProps) {
  const [value, setValue] = useState(defValue || initialValue);

  const handleIncrement = () => {
    setValue((prev) => Math.min(30, prev! + 1));
  };

  const handleDecrement = () => {
    setValue((prev) => Math.max(5, prev! - 1));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value) || 5;
    setValue(Math.min(30, Math.max(5, newValue)));
  };

  const handleSave = () => {
    onSave?.(value!);
    handleClose();
  };

  const handleDialogClose = () => {
    setValue(initialValue);
    handleClose();
  };

  return (
    <React.Fragment>
      <Dialog
        open={open}
        slots={{
          transition: Transition,
        }}
        keepMounted
        onClose={handleDialogClose}
        aria-describedby="configure-device-dialog"
        classes={{
          paper: styles.dialogPaper,
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className={styles.dialogTitle}>
          <span className={styles.titleText}>Configure Heartbeat</span>
          <IconButton
            onClick={handleDialogClose}
            className={styles.closeButton}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent className={styles.dialogContent}>
          <Box className={styles.counterContainer}>
            <IconButton
              onClick={handleDecrement}
              className={`${styles.counterButton} ${value > 5 ? styles.disabled : ''}`}
              disabled={value <= 5}
            >
              <RemoveIcon />
            </IconButton>

            <TextField
              value={value}
              onChange={handleInputChange}
              type="number"
              variant="outlined"
              size="medium"
              className={styles.valueInput}
              inputProps={{
                min: 5,
                max: 30,
                style: {
                  textAlign: 'center',
                  MozAppearance: 'textfield',
                },
              }}
              sx={{
                '& input[type=number]': {
                  MozAppearance: 'textfield',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />

            <IconButton
              onClick={handleIncrement}
              className={`${styles.counterButton} ${value < 30 ? styles.disabled : ''}`}
              disabled={value >= 30}
            >
              <AddIcon />
            </IconButton>
          </Box>

          <Button onClick={handleSave} className={styles.saveButton}>
            Save
          </Button>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
