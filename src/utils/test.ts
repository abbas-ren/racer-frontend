import dayjs from 'dayjs';
import { TestsPaginationState } from 'typesCustom/tests';

export const addUniqueLog = (logs: string[], newLog: string): string[] => {
  const normalized = newLog.replace(/\s+/g, '');
  const exists = logs.some((log) => log.replace(/\s+/g, '') === normalized);
  return exists ? logs : [...logs, newLog];
};

export function formatDuration(secondsInput: number): string {
  if (
    typeof secondsInput !== 'number' ||
    isNaN(secondsInput) ||
    secondsInput < 0
  ) {
    return '0 Sec';
  }

  const units = [
    { label: 'Month', value: 60 * 60 * 24 * 30 },
    { label: 'Week', value: 60 * 60 * 24 * 7 },
    { label: 'Day', value: 60 * 60 * 24 },
    { label: 'Hr', value: 60 * 60 },
    { label: 'Min', value: 60 },
    { label: 'Sec', value: 1 },
  ];

  const parts: string[] = [];

  for (const unit of units) {
    const unitAmount = Math.floor(secondsInput / unit.value);
    if (unitAmount > 0) {
      parts.push(`${unitAmount} ${unit.label}`);
      secondsInput %= unit.value;
    }
  }

  return parts.length > 0 ? parts.join(' ') : '0 Sec';
}

export function getDisplayDate(inputDate: string | Date): string {
  const parsed = dayjs(inputDate);

  if (!parsed.isValid()) {
    const now = dayjs();
    return now.format('DD MMM, h:mma');
  }

  return parsed.format('DD MMM, h:mma');
}
export function formatPercentage(value: unknown): number {
  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }

  const rounded = Math.round(num * 100) / 100;
  return parseFloat(rounded.toFixed(2));
}

export function getPercentage(part: number, total: number): number | false {
  if (!total || isNaN(part) || isNaN(total)) return false;
  return Math.round((part / total) * 100);
}

export function normalizePercentages(values: number[]): number[] {
  const total = values.reduce((sum, val) => sum + val, 0);
  if (total === 0) return values.map(() => 0);

  const raw = values.map((v) => (v / total) * 100);
  const floored = raw.map((p) => Math.floor(p * 100) / 100);

  let remainder = +(100 - floored.reduce((s, p) => s + p, 0)).toFixed(2);

  const result = [...floored];
  let i = 0;

  while (remainder > 0.001) {
    while (i < result.length && values[i] === 0) i++;
    if (i >= result.length) break;

    result[i] = +(result[i] + 0.01).toFixed(2);
    remainder = +(remainder - 0.01).toFixed(2);
    i++;
  }

  return result;
}

export function mergeUniqueById<T extends { id: string | number }>(
  existing: T[],
  incoming: T[],
): T[] {
  const map = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, item); // will replace if same id
  }
  return Array.from(map.values());
}

export const initialPaginationState = <T>(): TestsPaginationState<T> => ({
  items: [],
  loading: false,
  error: null,
});

function initPaginationState<T>(
  stateMap: Record<string | number, TestsPaginationState<T>>,
  key: string | number,
) {
  if (!stateMap[key]) {
    stateMap[key] = initialPaginationState<T>();
  }
}

export function setLoading<T>(
  stateMap: Record<string | number, TestsPaginationState<T>>,
  key: string | number,
) {
  initPaginationState<T>(stateMap, key);
  stateMap[key].loading = true;
  stateMap[key].error = null;
}

export function setFailure<T>(
  stateMap: Record<string | number, TestsPaginationState<T>>,
  key: string | number,
  error: string,
) {
  stateMap[key].loading = false;
  stateMap[key].error = error;
}

export function setSuccess<T extends { id: string | number }>(
  stateMap: Record<string | number, TestsPaginationState<T>>,
  key: string | number,
  items: T[],
) {
  initPaginationState<T>(stateMap, key);
  const prev = stateMap[key].items;
  stateMap[key].items = mergeUniqueById(prev, items);
  stateMap[key].loading = false;
  stateMap[key].error = '';
}
