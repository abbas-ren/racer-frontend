import dayjs from 'dayjs';
import { toHours } from 'utils/dashboard';

type SummaryEntry = {
  totalDevices: number;
  states?: {
    busy?: number;
    faulty?: number;
    not_reachable?: number;
    unlogged?: number;
    free?: number;
  };
  monthStart?: string | number | Date;
};

type Summary = {
  weekly?: unknown;
  monthly?: unknown;
};

export const transformAnalyticsToChartData = (
  data: Summary,
  type: 'weekly' | 'monthly' = 'weekly',
) => {
  const numberOfWeeks = 4;
  const chartData = [];

  for (let index = 0; index < numberOfWeeks; index += 1) {
    const source = data?.[type] as unknown;
    const week = Array.isArray(source)
      ? (source[index] as SummaryEntry | undefined)
      : source && typeof source === 'object'
        ? ((source as Record<number, SummaryEntry>)[index] as
            | SummaryEntry
            | undefined)
        : undefined;

    let busy = 0;
    let free = 0;
    let totalDevices = 0;

    if (week && week.totalDevices > 0) {
      totalDevices = week.totalDevices;
      busy = week.states?.busy || 0;

      const others =
        (week.states?.faulty || 0) +
        (week.states?.not_reachable || 0) +
        (week.states?.unlogged || 0);

      free = (week.states?.free || 0) + others;
    }

    chartData.push({
      name:
        type === 'weekly'
          ? `Week ${index + 1}`
          : dayjs(week?.monthStart).format('MMM'),
      busy: toHours(busy),
      free: toHours(free),
      totalDevices,
    });
  }

  return chartData;
};

const barColorMap: Record<string, { bar: string; cap: string }> = {
  busy: { bar: '#1DBD53', cap: '#026323' },
  free: { bar: '#3A90FF', cap: '#014398' },
  totalDevices: { bar: '#F7CCC2', cap: '#F5927A' },
};

export const CustomBarWithCap = (props: unknown) => {
  const { x, y, width, height, fill, dataKey } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    dataKey: string;
  };

  const { cap } = barColorMap[dataKey] || { cap: fill };
  const { bar } = barColorMap[dataKey] || { bar: fill };

  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={width} height={height} fill={bar} />
      <rect x={x} y={y - 4} width={width} height={4} fill={cap} />
    </g>
  );
};
