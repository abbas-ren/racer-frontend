import React from 'react';
import clsx from 'clsx';
import MuiButton from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styles from './ButtonRounded.module.scss';
import { SxProps } from '@mui/material/styles';

type ButtonRoundedVariant =
  | 'progress'
  | 'success'
  | 'disabled'
  | 'error'
  | 'faded';

export interface ButtonRoundedProps {
  variant?: ButtonRoundedVariant;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  outlined?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  sx?: SxProps;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

const ButtonRounded: React.FC<ButtonRoundedProps> = ({
  variant = 'progress',
  disabled = false,
  children,
  className,
  outlined = false,
  startIcon,
  endIcon,
  sx,
  onClick,
  type = 'button',
}) => {
  const isDisabled = disabled || variant === 'disabled';

  const buttonClass = clsx(
    styles.buttonRounded,
    {
      [styles.progress]: variant === 'progress' && !outlined,
      [styles.success]: variant === 'success' && !outlined,
      [styles.error]: variant === 'error' && !outlined,
      [styles.disabled]: isDisabled && !outlined,
      [styles.faded]: variant === 'faded' && !outlined,
    },
    { [styles.outlined]: outlined },
    className,
  );

  return (
    <MuiButton
      type={type}
      disabled={isDisabled}
      className={buttonClass}
      startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        py: 1.5,
        px: 3,
        minWidth: 'unset',
        height: '28px',
        borderRadius: '11px',
        '.MuiButton-startIcon': {
          marginRight: '0 !important',
        },
        ...sx,
      }}
      onClick={onClick}
    >
      <Typography variant="body4" fontWeight={700}>
        {children}
      </Typography>
    </MuiButton>
  );
};

export default ButtonRounded;
