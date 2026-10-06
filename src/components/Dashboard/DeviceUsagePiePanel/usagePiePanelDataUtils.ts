import { clampPercentage, toHours } from 'utils/dashboard';
import type { Palette } from '@mui/material/styles';

type PaletteShape = Palette;

interface PiePanelData {
  name: string;
  value: number;
  fill: string;
}

export interface PiePanel {
  data: PiePanelData[];
  utilizedHours: number;
  totalHours: number;
  idleHours: number;
}

type DailyUsage = {
  totalSeconds?: number;
  states?: {
    busy?: number;
  };
};

export const buildPiePanelData = (
  deviceUsageDaily: DailyUsage | null | undefined,
  palette: PaletteShape,
): PiePanel => {
  if (!deviceUsageDaily) {
    return {
      data: [{ name: '', value: 1, fill: palette.grey[400] }],
      utilizedHours: 0,
      idleHours: 0,
      totalHours: 0,
    };
  }

  const totalAvailableSeconds = deviceUsageDaily.totalSeconds ?? 0;
  const utilizedSeconds = deviceUsageDaily.states?.busy ?? 0;

  const totalAvailable = toHours(totalAvailableSeconds);
  const utilizedTime = toHours(utilizedSeconds);
  const idleTime = +(totalAvailable - utilizedTime).toFixed(2);

  const rawUtilizedPercent =
    totalAvailable > 0 ? (utilizedTime / totalAvailable) * 100 : 0;
  const rawIdlePercent = 100 - rawUtilizedPercent;

  const utilizedPercent = clampPercentage(rawUtilizedPercent);
  const idlePercent = clampPercentage(rawIdlePercent);

  const isAllZero =
    totalAvailable === 0 || (utilizedTime === 0 && idleTime === 0);

  const data = isAllZero
    ? [{ name: '', value: 1, fill: palette.grey[400] }]
    : [
        {
          name: `${utilizedPercent}%`,
          value: utilizedPercent,
          fill: palette.success.main,
        },
        {
          name: `${idlePercent}%`,
          value: idlePercent,
          fill: palette.info.main,
        },
      ];

  return {
    data: data.filter((entry) => entry.value > 0),
    totalHours: totalAvailable,
    utilizedHours: utilizedTime,
    idleHours: idleTime,
  };
};
