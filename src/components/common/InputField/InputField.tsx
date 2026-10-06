import React, { forwardRef, useId } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  FormHelperText,
  styled,
  InputBase,
  alpha,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import styles from './InputField.module.scss';
import clsx from 'clsx';

interface CustomFormControlProps {
  label?: React.ReactNode;
  helperText?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  value?: string | number;
  error?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  type?: React.HTMLInputTypeAttribute | undefined;
  name?: string;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
  specificWidth?: string;
  fullWidth?: boolean;
  customClasses?: string;
  floating?: boolean;
  inputStyle?: React.CSSProperties;
  sx?: React.CSSProperties;
}
const CustomInputField = forwardRef<HTMLInputElement, CustomFormControlProps>(
  (
    {
      label,
      helperText,
      required = false,
      placeholder,
      value,
      error = false,
      onChange,
      type = 'text',
      name,
      disabled = false,
      variant = 'outlined',
      specificWidth,
      fullWidth = true,
      customClasses,
      floating = false,
      inputStyle,
      sx,
    },
    ref,
  ) => {
    const id = useId();
    const [showPassword, setShowPassword] = React.useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const theme = useTheme();

    return (
      <FormControl
        className={clsx(styles['form_control'], customClasses)}
        required={required}
        error={error}
        variant={variant === 'filled' ? 'filled' : 'outlined'}
        sx={{
          width: specificWidth,
        }}
        fullWidth={fullWidth}
      >
        {variant === 'filled' ? (
          <>
            <InputLabel
              className={styles.filled_label}
              shrink
              htmlFor={`bootstrap-input-${id}`}
            >
              {label}
            </InputLabel>
            <BootstrapInput
              id={`bootstrap-input-${id}`}
              aria-placeholder={helperText}
              onChange={onChange}
              type={type}
              name={name}
              placeholder={placeholder}
              defaultValue={value}
              disabled={disabled}
              required={required}
              className={styles.filled_input}
              ref={ref}
            />
          </>
        ) : (
          <>
            <TextField
              name={name}
              label={floating ? label : ''}
              id={`input-${id}`}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              error={error}
              type={
                type === 'password'
                  ? showPassword
                    ? 'text'
                    : 'password'
                  : type
              }
              disabled={disabled}
              variant="outlined"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0.375rem',
                  minWidth: specificWidth,
                  backgroundColor: theme.palette.background.elevated,
                  color: theme.palette.text.body,
                  '& fieldset': {
                    borderColor: error
                      ? theme.palette.error.main
                      : theme.palette.primary[100],
                  },
                  '&:hover fieldset': {
                    borderColor: error
                      ? theme.palette.error.main
                      : theme.palette.primary[300],
                  },
                },
                '& .MuiOutlinedInput-root.Mui-focused': {
                  '& fieldset': {
                    borderColor: error
                      ? theme.palette.error.main
                      : theme.palette.primary[300],
                    borderWidth: '1px',
                  },
                },
                '& label.Mui-focused': {
                  color: error
                    ? theme.palette.error.main
                    : theme.palette.primary[300],
                },
                // Prevent autofill background flash
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.elevated} inset !important`,
                  WebkitTextFillColor: `${theme.palette.text.body} !important`,
                  caretColor: `${theme.palette.text.body}`,
                },
                // Remove default autofill styles
                '& input:-webkit-autofill:hover, & input:-webkit-autofill:focus':
                  {
                    transition: 'background-color 0s 600000s, color 0s 600000s',
                  },
                ...sx,
              }}
              slotProps={{
                input: {
                  sx: inputStyle,
                  endAdornment: type === 'password' && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword
                            ? 'hide the password'
                            : 'display the password'
                        }
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
                inputLabel: {
                  shrink: floating,
                },
              }}
              ref={ref}
            />
          </>
        )}
        {helperText && error && <FormHelperText>{helperText}</FormHelperText>}
        {error && !helperText && (
          <FormHelperText error>Field is required</FormHelperText>
        )}
      </FormControl>
    );
  },
);

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(3),
    transform: 'translate(0, 0) scale(0.9)',
  },
  '& .MuiInputBase-input': {
    borderRadius: 4,
    position: 'relative',
    backgroundColor: theme.palette.background.elevated,
    border: '1px solid',
    borderColor: theme.palette.primary[100],
    fontSize: 16,
    width: '100%',
    padding: '10px 12px',
    transition: theme.transitions.create([
      'border-color',
      'background-color',
      'box-shadow',
    ]),
  },
  '&:focus': {
    boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
    borderColor: theme.palette.primary.main,
  },
}));

export default CustomInputField;
