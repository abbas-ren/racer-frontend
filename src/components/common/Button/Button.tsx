import React from 'react';
import clsx from 'clsx';
import MuiButton from '@mui/material/Button';
import styles from './Button.module.scss';
import { ButtonPreset, CustomButtonProps } from 'typesCustom/types';

const Button: React.FC<CustomButtonProps> = ({
  preset = ButtonPreset.Primary,
  disabled = false,
  children,
  className,
  outlined = false,
  sx,
  ...buttonProps
}) => {
  const buttonClass = clsx(
    styles.button,
    {
      [styles.primary]: preset === ButtonPreset.Primary,
      [styles.secondary]: preset === ButtonPreset.Secondary,
      [styles.error]: preset === ButtonPreset.Error,
      [styles.disabled_style]: preset === ButtonPreset.Disabled,
    },
    {
      [styles.outlined]: outlined,
      [styles.disabled]: disabled,
    },
    className,
  );

  return (
    <MuiButton
      disabled={disabled}
      className={buttonClass}
      sx={{ ...sx }}
      {...buttonProps}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
