import React, { memo } from 'react';
import clsx from 'clsx';
import styles from './CustomIcon.module.scss';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';

interface CustomIconProps {
  name: IconName;
  color?: string;
  width?: number | string;
  size?: number;
  active?: boolean;
  className?: string;
  variant?: 'filled' | 'outlined';
}

const CustomIcon: React.FC<CustomIconProps> = ({
  name,
  color,
  size = 27,
  active = false,
  className,
  variant = 'outlined',
}) => {
  const stateClass = active ? styles.active : styles.inactive;

  return (
    <DynamicIcon
      name={name}
      color={color ?? undefined}
      size={size}
      {...((variant === 'filled' && { fill: color ?? undefined }) || {})}
      className={clsx(stateClass, className)}
    />
  );
};

export default memo(CustomIcon);
