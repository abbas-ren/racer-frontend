export function formatDate(date: Date, showTime: boolean = false): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let formattedDate = `${day}/${month}/${year}`;

  if (showTime) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 24hr to 12hr format
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    formattedDate += ` ${formattedTime}`;
  }

  return formattedDate;
}

export function formatTime(date: Date): string {
  const time = date.toLocaleString('default', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  // Return the formatted string
  return `${time}`;
}

export function formatDateTime(date: Date): string {
  // Get the day (e.g., 6)
  const day = date.getDate();

  // Get the month abbreviation (e.g., Nov)
  const month = date.toLocaleString('default', { month: 'short' });

  // Get the day of the week abbreviation (e.g., Wed)
  const weekday = date.toLocaleString('default', { weekday: 'short' });

  // Get the time in 12-hour format with AM/PM (e.g., 10:30 am)
  const time = date.toLocaleString('default', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  // Return the formatted string
  return `${day} ${month}, ${weekday} | ${time}`;
}

export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;

  if (typeof value === 'string') return value.trim().length === 0;

  if (typeof value === 'number') return isNaN(value) || value === 0;

  if (typeof value === 'boolean') return false; // Booleans are never empty

  if (Array.isArray(value)) return value.length === 0;

  if (value instanceof Map || value instanceof Set) return value.size === 0;

  if (typeof value === 'object') return Object.keys(value).length === 0;

  return false;
}

export enum UserRequestAction {
  Accept = 'Accept',
  Decline = 'Decline',
}

export enum ROLES {
  Admin = 'admin',
  User = 'user',
}

export function getPercentage(data: { total: number; current: number }) {
  const { total, current } = data;
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}
