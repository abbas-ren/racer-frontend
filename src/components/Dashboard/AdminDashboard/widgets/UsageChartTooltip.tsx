import { composeDashboardClasses } from '../styles/dashboardStyles';

type TooltipEntry = {
  dataKey: string;
  value: number | string;
};

interface UsageChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const UsageChartTooltip = ({
  active,
  payload = [],
  label,
}: UsageChartTooltipProps) => {
  if (!active || payload.length === 0) {
    return null;
  }

  const readValue = (key: string) =>
    payload.find((p) => p.dataKey === key)?.value;

  return (
    <div className={composeDashboardClasses('custom-usage-tooltip')}>
      <p className={composeDashboardClasses('cut-label')}>{label}</p>
      <div className={composeDashboardClasses('cut-item', 'cut-item-spaced')}>
        <span className={composeDashboardClasses('cut-name')}>
          deviceIdle
          <span className={composeDashboardClasses('cut-colon')}>:</span>
        </span>
        <span className={composeDashboardClasses('cut-value')}>
          {readValue('idle')}
        </span>
      </div>
      <div className={composeDashboardClasses('cut-item', 'cut-item-spaced')}>
        <span className={composeDashboardClasses('cut-name')}>
          deviceUtilized
          <span className={composeDashboardClasses('cut-colon')}>:</span>
        </span>
        <span className={composeDashboardClasses('cut-value')}>
          {readValue('utilized')}
        </span>
      </div>
      <div className={composeDashboardClasses('cut-item')}>
        <span className={composeDashboardClasses('cut-name')}>
          numberOfDevices
          <span className={composeDashboardClasses('cut-colon')}>:</span>
        </span>
        <span className={composeDashboardClasses('cut-value')}>
          {readValue('devices')}
        </span>
      </div>
    </div>
  );
};

export default UsageChartTooltip;
