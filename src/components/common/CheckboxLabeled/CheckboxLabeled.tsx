import React from 'react';
import Checkbox, { CheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';

export interface CheckboxLabeledProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  suiteId?: string;
  caseId?: string;
  onChangeWithIds?: (
    suiteId: string,
    caseId: string | undefined,
    checked: boolean,
  ) => void;
  label?: string | React.ReactNode;
  labelVariant?: string;
  labelWeight?: number;
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom';
  className?: string;
  // visual customization
  size?: number; // px, default 18
  radius?: number; // px, default 4
  checkedColor?: string; // default theme primary.300
  uncheckedBorderColor?: string; // default theme divider
}

// Extra props only for styling (not forwarded to DOM)
interface StyledExtraProps {
  checkboxSize?: number;
  cornerRadius?: number;
  checkedColor?: string;
  uncheckedBorderColor?: string;
}

const StyledCheckbox = styled((props: CheckboxProps & StyledExtraProps) => {
  const {
    checkboxSize, // consumed by styled
    cornerRadius, // consumed by styled
    checkedColor, // consumed by styled
    uncheckedBorderColor, // consumed by styled
    ...rest
  } = props;
  return <Checkbox {...rest} />;
})<StyledExtraProps>(
  ({
    checkboxSize = 18,
    cornerRadius = 4,
    checkedColor = 'var(--mui-palette-primary-300)',
    uncheckedBorderColor = 'var(--mui-palette-grey-400)',
  }) => ({
    padding: 0,
    width: checkboxSize,
    height: checkboxSize,
    '& .MuiSvgIcon-root': {
      fontSize: checkboxSize,
      borderRadius: cornerRadius,
    },
    '&.Mui-checked .MuiSvgIcon-root, &.MuiCheckbox-indeterminate .MuiSvgIcon-root':
      {
        color: checkedColor,
      },
    '&:not(.Mui-checked):not(.MuiCheckbox-indeterminate) .MuiSvgIcon-root': {
      color: uncheckedBorderColor,
    },
    '&:not(.Mui-checked):not(.MuiCheckbox-indeterminate) .MuiSvgIcon-root path':
      {
        strokeWidth: 2,
      },
  }),
);

const CheckboxLabeled: React.FC<CheckboxLabeledProps> = ({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
  suiteId,
  caseId,
  onChangeWithIds,
  label,
  labelPlacement = 'end',
  className,
  size = 18,
  radius = 4,
  checkedColor = 'var(--mui-palette-primary-300)',
  uncheckedBorderColor = 'var(--mui-palette-divider)',
}) => {
  const handleChange: CheckboxProps['onChange'] = (_e, isChecked) => {
    if (onChangeWithIds && suiteId) {
      onChangeWithIds(suiteId, caseId, isChecked);
      return;
    }
    onChange?.(isChecked);
  };

  const control = (
    <StyledCheckbox
      className={className}
      checked={checked}
      indeterminate={indeterminate}
      disabled={disabled}
      onChange={handleChange}
      checkboxSize={size}
      cornerRadius={radius}
      checkedColor={checkedColor}
      uncheckedBorderColor={uncheckedBorderColor}
    />
  );

  if (!label) {
    return control;
  }

  return (
    <FormControlLabel
      label={label}
      control={control}
      labelPlacement={labelPlacement}
      disabled={disabled}
    />
  );
};

export default CheckboxLabeled;
