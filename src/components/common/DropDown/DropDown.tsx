import React, { useCallback, useRef } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  Typography,
  SelectProps,
  TypographyProps,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import styles from './DropDown.module.scss';
import clsx from 'clsx';

export interface DropdownItem {
  value: string | number;
  label: string | React.ReactNode;
}

interface DropdownProps extends Omit<SelectProps, 'onChange' | 'Value'> {
  value: string;
  placeholder?: string;
  items: DropdownItem[];
  onChange: (event: SelectChangeEvent<string>, child?: React.ReactNode) => void;
  className?: string;
  border?: string;
  rootClass?: CSSModuleClasses[string];
  labelProps?: TypographyProps;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

const DropDown: React.FC<DropdownProps> = ({
  value,
  onChange,
  items,
  placeholder = 'Select',
  className = '',
  border = 'none',
  rootClass = '',
  labelProps,
  loadingMore = false,
  onLoadMore,
  ...props
}) => {
  const menuListRef = useRef<HTMLUListElement>(null);

  const handleScroll = useCallback(() => {
    const el = menuListRef.current;
    if (!el || !onLoadMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      onLoadMore();
    }
  }, [onLoadMore]);

  return (
    <FormControl>
      <Select
        displayEmpty
        value={value}
        onChange={(e) => onChange(e as SelectChangeEvent<string>)}
        IconComponent={KeyboardArrowDownIcon}
        classes={{ root: clsx(styles.selectRoot, rootClass) }}
        sx={{
          '.MuiOutlinedInput-notchedOutline': {
            border: border,
          },
        }}
        renderValue={(selected) => {
          const selectedItem = items?.find((item) => item.value === selected);
          return (
            selectedItem?.label ?? (
              <Typography
                component="span"
                variant="system1"
                color="text.caption"
                {...labelProps}
              >
                {placeholder}
              </Typography>
            )
          );
        }}
        MenuProps={{
          PaperProps: {
            style: { maxHeight: 220 },
          },
          MenuListProps: {
            ref: menuListRef,
            onScroll: handleScroll,
            style: { maxHeight: 220, overflowY: 'auto' },
          },
        }}
        className={className}
        {...props}
      >
        {items?.map((item) => (
          <MenuItem
            key={item.value}
            value={item.value}
            className={styles.menuItem}
          >
            <Typography component="span" variant="body2" color="text.body">
              {item.label}
            </Typography>
          </MenuItem>
        ))}
        {loadingMore && (
          <MenuItem disabled>
            <Typography component="span" variant="caption">
              Loading
            </Typography>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default DropDown;
