import { styled } from '@mui/material/styles';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export type AppInputProps = TextFieldProps & {
  width?: string | number;
  height?: string | number;
};

const AppInput = styled(TextField, {
  shouldForwardProp: (prop) => prop !== 'width' && prop !== 'height',
})<AppInputProps>(({ theme, width, height }) => ({
  width: width || '192px',
  height: height || '32px',

  '& .MuiOutlinedInput-root': {
    font: theme.typography.body2,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',

    '& input': {
      padding: '8px 12px',
      color: theme.palette.text.primary,
      boxSizing: 'border-box',
    },

    '& input::placeholder': {
      color: theme.palette.text.disabled,
      opacity: 1,
    },

    '& fieldset': {
      borderColor: theme.palette.divider,
    },

    '&:hover fieldset': {
      borderColor: theme.palette.action.hover,
    },

    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },

    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`,
    },
  },
}));

export default AppInput;
