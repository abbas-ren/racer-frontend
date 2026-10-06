import {
  Box,
  BoxProps,
  Stack,
  SxProps,
  Typography,
  TypographyProps,
} from '@mui/material';

interface LegendLabelProps {
  color?: string;
  label: string;
  sx?: SxProps;
  labelProps?: TypographyProps;
  indicatorProps?: BoxProps;
}

function LegendLabel({
  color,
  label,
  sx,
  labelProps,
  indicatorProps,
}: LegendLabelProps) {
  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      gap="0.25rem"
      sx={sx}
    >
      <Box
        bgcolor={color}
        width="0.75rem"
        height="0.75rem"
        borderRadius="2px"
        {...indicatorProps}
      />
      <Typography variant="body4" {...labelProps}>
        {label}
      </Typography>
    </Stack>
  );
}

export default LegendLabel;
