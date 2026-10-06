import { useTheme } from '@mui/material';
import React from 'react';
import { Text } from 'recharts';

interface CustomLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  index?: number;
  payload?: {
    name: string;
  };
  fontSize?: number;
}

const CustomLabel: React.FC<CustomLabelProps> = ({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  payload,
  fontSize = 12,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) / 2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const theme = useTheme();

  return (
    <Text
      x={x}
      y={y}
      fill={theme.palette.button?.primary?.text}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={fontSize}
      fontWeight="500"
    >
      {payload?.name}
    </Text>
  );
};

export default CustomLabel;
