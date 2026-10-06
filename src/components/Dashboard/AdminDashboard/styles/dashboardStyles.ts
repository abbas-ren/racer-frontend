import clsx from 'clsx';
import styles from './AdminDashboard.module.scss';

type DashboardClassKey = keyof typeof styles;

export const dashboardStyles = styles;

export const composeDashboardClasses = (
  ...keys: Array<DashboardClassKey | false | null | undefined>
) => clsx(keys.map((key) => (key ? styles[key] : undefined)));
