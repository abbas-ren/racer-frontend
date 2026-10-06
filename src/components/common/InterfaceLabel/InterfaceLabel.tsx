import React, { useState, useRef } from 'react';
import {
  Typography,
  Popper,
  Paper,
  Stack,
  Chip,
  ClickAwayListener,
} from '@mui/material';
import styles from './InterfaceLabel.module.scss';
import InfoOutline from '@mui/icons-material/InfoOutline';
import clsx from 'clsx';

type InterfaceItem = {
  interfaceId: string;
};

interface InterfaceLabelProps {
  label: number;
  items: InterfaceItem[];
  disabled?: boolean;
}

const InterfaceLabel: React.FC<InterfaceLabelProps> = ({
  label,
  items,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleMouseEnter = () => {
    setOpen(true);
  };

  const handleMouseLeave = () => {
    setOpen(false);
  };

  return (
    <>
      <Stack
        ref={anchorRef}
        className={clsx(styles.tooltipLabel, {
          [styles.disabled]: disabled,
        })}
        justifyContent="center"
        alignItems="center"
        direction="row"
        onMouseEnter={() => !disabled && handleMouseEnter()}
        onMouseLeave={() => !disabled && handleMouseLeave()}
      >
        <Typography
          variant="button"
          className={clsx({
            [styles.disabledText]: disabled,
          })}
        >
          {label}
        </Typography>
        <InfoOutline
          className={clsx(styles.tooltipIcon, {
            [styles.disabledText]: disabled,
          })}
        />
      </Stack>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
        sx={{
          zIndex: 2,
        }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper elevation={4} className={styles.tooltipContent}>
            <Stack className={styles.tooltipItems} direction="row">
              {items.map((item, i) => (
                <Chip
                  key={i}
                  label={item.interfaceId}
                  className={styles.tooltipChip}
                  size="small"
                />
              ))}
            </Stack>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

export default InterfaceLabel;
