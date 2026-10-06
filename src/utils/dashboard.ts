import { Theme } from '@mui/material';
import { DeviceState } from 'typesCustom/components';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

export function getDeviceStateLabel({
  type,
}: {
  type: DeviceState | 'upgrading';
}) {
  switch (type) {
    case 'upgrading':
      return 'Upgrading';
    case DeviceState.AVAILABLE:
      return 'Available';
    case DeviceState.BUSY:
      return 'Busy';
    case DeviceState.FAULTY:
      return 'Faulty';
    case DeviceState.NOT_REACHABLE:
      return 'Not Reachable';
    default:
      return 'Devices';
  }
}

export function getDeviceStateColor({
  type,
  theme,
}: {
  type: DeviceState | 'upgrading';
  theme: Theme;
}) {
  switch (type) {
    case 'upgrading':
      return theme.palette.button?.disabled?.text;
    case DeviceState.AVAILABLE:
      return theme.palette.success.main;
    case DeviceState.BUSY:
      return theme.palette.warning.main;
    case DeviceState.FAULTY:
      return theme.palette.error.main;
    case DeviceState.NOT_REACHABLE:
      return theme.palette.text.caption;
    default:
      return 'transparent';
  }
}

dayjs.extend(duration);
dayjs.extend(relativeTime);

const units: ['months' | 'weeks' | 'days' | 'hours' | 'minutes', string][] = [
  ['months', 'month'],
  ['weeks', 'week'],
  ['days', 'day'],
  ['hours', 'hour'],
  ['minutes', 'minute'],
];

export const getRelativeDuration = (
  timestamp: string | number | Date,
): string => {
  const now = dayjs();
  const past = dayjs(timestamp);
  const diffMs = now.diff(past);

  const dur = dayjs.duration(diffMs);

  const parts = units
    .map(([unit, label]) => {
      const val = dur.get(unit);
      return val > 0 ? `${val} ${label}${val > 1 ? 's' : ''}` : null;
    })
    .filter(Boolean);

  const topTwo = parts.slice(0, 2).join(', ');
  return topTwo ? `Since ${topTwo}` : 'Just now';
};

export function truncateTo2Decimals(num: number) {
  return Math.floor(num * 100) / 100;
}

export const clampPercentage = (value: number): number => {
  if (value === 0 || value === 100) return value;
  if (value < 0.01) return 0.01;
  if (value > 99.99) return 99.99;
  return +value.toFixed(2);
};

export function toHours(seconds: number): number {
  return seconds > 0 ? +(seconds / 3600).toFixed(2) : 0;
}
