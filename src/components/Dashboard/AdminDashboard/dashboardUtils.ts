import { BuildPerformanceItem, SidebarConfig, SidebarDevice } from './types';

export const formatFullDate = (date?: Date | null): string => {
  if (!date) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Keep date-range boundaries aligned to IST calendar days.
export const getLastSevenDaysRange = (): { start: Date; end: Date } => {
  const now = new Date();

  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const date = istDate.getUTCDate();

  const endDate = new Date(year, month, date);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  return { start: startDate, end: endDate };
};

export const getCurrentMonthRange = (): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return { start, end: now };
};

export const getSidebarDevices = (
  build: BuildPerformanceItem | null,
  sidebarConfig: SidebarConfig | null,
): SidebarDevice[] => {
  if (!build) return [];

  const defaults = sidebarConfig?.deviceDefaults;
  const tags = (build.tags ?? []).filter((tag) => !tag.startsWith('+'));

  if (!defaults || tags.length === 0) {
    return tags.map((tag, index) => ({
      tag,
      ip: `-`,
      id: `${tag}-${index + 1}`,
    }));
  }

  const { ipPrefix, ipStart, idSuffix } = defaults;

  return tags.map((tag, index) => ({
    tag,
    ip:
      ipPrefix !== undefined && ipStart !== undefined
        ? `${ipPrefix}${ipStart + index}`
        : '-',
    id: idSuffix ? `${tag}${idSuffix}` : `${tag}-${index + 1}`,
  }));
};
