import Switch from '@mui/material/Switch';
import { styled, Theme } from '@mui/material/styles';

export type CustomSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
  thumbSize?: number;
  trackColor?: string;
  thumbColor?: string;
  shadow?: string;
};

const StyledSwitch = styled(
  ({ checked, onChange, ...props }: CustomSwitchProps) => (
    <Switch
      checked={checked}
      onChange={(_, value) => onChange(value)}
      disableRipple
      {...props}
    />
  ),
)(({
  theme,
  width = 36,
  height = 20,
  thumbSize = 18,
  trackColor,
  thumbColor,
  shadow,
}: {
  theme: Theme;
  width?: number;
  height?: number;
  thumbSize?: number;
  trackColor?: string;
  thumbColor?: string;
  shadow?: string;
}) => {
  const themeColors = theme.palette;
  const finalTrackColor = trackColor || themeColors.switch?.trackOff;
  const finalThumbColor = thumbColor || themeColors.switch?.thumb;
  const shadowColor = themeColors.shadow?.subtle || 'rgba(0, 0, 0, 0.1)';
  const finalShadow =
    shadow ||
    `0px 4px 6px -4px ${shadowColor}, 0px 10px 15px -3px ${shadowColor}`;

  return {
    width,
    height,
    padding: 0,

    '& .MuiSwitch-switchBase': {
      padding: `${(height - thumbSize) / 2}px`,
      transition: 'transform 200ms ease',

      '&.Mui-checked': {
        transform: `translateX(${width - thumbSize - 4}px)`,

        '& + .MuiSwitch-track': {
          backgroundColor: finalTrackColor,
          opacity: 1,
        },

        '& .MuiSwitch-thumb': {
          backgroundColor: finalThumbColor,
          boxShadow: finalShadow,
        },
      },
    },

    '& .MuiSwitch-thumb': {
      width: thumbSize,
      height: thumbSize,
      backgroundColor: finalThumbColor,
      boxShadow: finalShadow,
      transition: 'box-shadow 200ms ease',
    },

    '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
      boxShadow: finalShadow,
    },

    '& .MuiSwitch-track': {
      borderRadius: height / 2,
      backgroundColor: finalTrackColor,
      opacity: 1,
      transition: 'background-color 200ms ease',
    },
  };
});

export const CustomSwitch = StyledSwitch;
