import React from 'react';
import { Box, Button, SxProps, Theme } from '@mui/material';
import clsx from 'clsx';
import styles from './ToggleSwitch.module.scss';

interface ToggleSwitchProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
  sx?: SxProps<Theme>;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  options,
  selected,
  onChange,
  className,
  sx,
}) => {
  return (
    <Box className={clsx(styles.toggleContainer, className)} sx={sx}>
      {options.map((option) => (
        <Button
          key={option}
          onClick={() => onChange(option)}
          className={clsx(styles.toggleButton, {
            [styles.active]: selected === option,
          })}
          disableRipple
        >
          {option}
        </Button>
      ))}
    </Box>
  );
};

export default ToggleSwitch;
