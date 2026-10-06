import { Box } from '@mui/material';
import { CheckBoxChecked, CheckBoxIndeterminate } from 'assets/index';

interface CustomCheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  size?: number;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

function CustomCheckbox({
  checked = false,
  indeterminate = false,
  size = 18,
  onChange,
  disabled = false,
}: CustomCheckboxProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  if (indeterminate) {
    return (
      <Box
        onClick={handleClick}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CheckBoxIndeterminate width={size} height={size} />
      </Box>
    );
  }

  if (checked) {
    return (
      <Box
        onClick={handleClick}
        sx={{
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CheckBoxChecked width={size} height={size} />
      </Box>
    );
  }

  // Unchecked state - empty box
  return (
    <Box
      onClick={handleClick}
      sx={{
        marginTop: '2px',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '2px',
        border: '2px solid',
        borderColor: 'grey.400',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    />
  );
}

export default CustomCheckbox;
