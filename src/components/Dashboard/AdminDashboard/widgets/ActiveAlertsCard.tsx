import {
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react';
import { Bell, Calendar, Clock } from 'lucide-react';
import CardHeader from './CardHeader';
import DateRangePickerPopover from 'components/common/DateRangePickerPopover';
import { formatFullDate } from '../dashboardUtils';
import { AlertItem, DateRange } from '../types';
import { composeDashboardClasses } from '../styles/dashboardStyles';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store/store';
import { Alerts } from 'store/types/sagaTypes';
import { useAlertSocket } from 'hooks/useAlertSocket';
import {
  addSingleAlert,
  fetchAlertDetailRequest,
  fetchAlertRequest,
  readAlertRequest,
} from 'store/slices';

interface ActiveAlertsCardProps {
  onAlertClick: (alert: AlertItem) => void;
}

const ALERT_PAGE_LIMIT = 20;

const asString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
};

const toStartOfDayISO = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
};

const toEndOfDayISO = (date: Date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next.toISOString();
};

const toAlertSeverity = (type: string): string => {
  switch (type) {
    case 'error':
      return 'Critical';
    case 'warning':
      return 'Warning';
    default:
      return 'Info';
  }
};

const toAlertItem = (alert: Alerts): AlertItem => {
  const alertData = (alert.data || {}) as Record<string, unknown>;
  const deviceId = asString(alertData.deviceId) || asString(alert.deviceId);
  const buildId = asString(alertData.buildId) || asString(alert.buildId);
  const faultyReportId =
    asString(alertData.faultyReportId) || asString(alert.faultyReportId);
  const deviceControllerId =
    asString(alertData.deviceControllerId) ||
    asString(alert.deviceControllerId);

  const deviceTitle = deviceId || alert.title || buildId || 'System';

  return {
    id: alert.id,
    status: alert.isRead ? 'completed' : 'active',
    severity: toAlertSeverity(alert.type),
    device: String(deviceTitle),
    desc: alert.message,
    time: new Date(alert.createdAt).toLocaleString(),
    date: alert.createdAt,
    type: alert.type,
    deviceId,
    buildId,
    faultyReportId,
    deviceControllerId,
    deviceFamily: asString(alertData.deviceFamily),
    deviceType: asString(alertData.deviceType),
    submittedBy: asString(alertData.createdBy),
    buildVersion:
      asString(alertData.buildVersion) ||
      asString(alertData.version) ||
      asString(alertData.softwareVersion),
    criticalDeviceStatus: undefined,
  };
};

const ActiveAlertsCard = ({ onAlertClick }: ActiveAlertsCardProps) => {
  const dispatch = useDispatch();
  const alertsState = useSelector((state: RootState) => state.alerts);

  const [datePickerAnchorEl, setDatePickerAnchorEl] =
    useState<HTMLElement | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return { start: today, end: new Date(today) };
  });
  const [alertsPage, setAlertsPage] = useState(1);

  const isDatePickerOpen = Boolean(datePickerAnchorEl);

  const fromDate = useMemo(() => toStartOfDayISO(dateRange.start), [dateRange]);
  const toDate = useMemo(() => toEndOfDayISO(dateRange.end), [dateRange]);

  useEffect(() => {
    dispatch(
      fetchAlertRequest({
        page: 1,
        limit: ALERT_PAGE_LIMIT,
        from: fromDate,
        to: toDate,
      }),
    );
  }, [dispatch, fromDate, toDate]);

  useEffect(() => {
    if (alertsState.selectedAlertDetail) {
      onAlertClick(alertsState.selectedAlertDetail);
    }
  }, [alertsState.selectedAlertDetail, onAlertClick]);

  const handleLiveAlert = useCallback(
    (incoming: { message?: unknown }) => {
      if (!incoming?.message || typeof incoming.message !== 'object') {
        return;
      }

      const possibleAlert = incoming.message as Partial<Alerts>;
      if (!possibleAlert.id || !possibleAlert.createdAt) {
        return;
      }

      const createdAtTs = new Date(possibleAlert.createdAt).getTime();
      const startTs = new Date(fromDate).getTime();
      const endTs = new Date(toDate).getTime();

      if (createdAtTs >= startTs && createdAtTs <= endTs) {
        dispatch(addSingleAlert(possibleAlert as Alerts));
      }
    },
    [dispatch, fromDate, toDate],
  );

  useAlertSocket(handleLiveAlert);

  const activeAlertsData = useMemo(
    () => alertsState.data.map(toAlertItem),
    [alertsState.data],
  );

  const filteredAlerts = useMemo(
    () =>
      activeAlertsData.filter((alert) => {
        if (!alert.date) {
          return false;
        }

        const alertDate = new Date(alert.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        return alertDate >= start && alertDate <= end;
      }),
    [activeAlertsData, dateRange],
  );

  const hasMore = alertsPage < alertsState.totalPages;
  const unreadAlertCount = alertsState.totalUnreadCount;
  const isLoadingMore = alertsState.loading && alertsPage > 1;

  const handleLoadMore = useCallback(() => {
    if (alertsState.loading || !hasMore) {
      return;
    }

    const nextPage = alertsPage + 1;
    setAlertsPage(nextPage);

    dispatch(
      fetchAlertRequest({
        page: nextPage,
        limit: ALERT_PAGE_LIMIT,
        from: fromDate,
        to: toDate,
        append: true,
      }),
    );
  }, [alertsPage, alertsState.loading, dispatch, fromDate, hasMore, toDate]);

  const handleApplyDate = (start: Date | null, end: Date | null) => {
    if (start && end) {
      setAlertsPage(1);
      setDateRange({ start, end });
      setDatePickerAnchorEl(null);
    }
  };

  const handleOpenDatePicker = (event: MouseEvent<HTMLButtonElement>) => {
    if (isDatePickerOpen) {
      setDatePickerAnchorEl(null);
      return;
    }

    setDatePickerAnchorEl(event.currentTarget);
  };

  const handleAlertClick = useCallback(
    (alert: AlertItem) => {
      onAlertClick(alert);
      dispatch(fetchAlertDetailRequest(alert));

      const targetId = String(alert.id);
      const foundAlert = alertsState.data.find(
        (item) => String(item.id) === targetId,
      );
      if (foundAlert && !foundAlert.isRead) {
        dispatch(readAlertRequest(targetId));
      }
    },
    [alertsState.data, dispatch, onAlertClick],
  );

  const handleContainerScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoadingMore) return;

    const target = event.currentTarget;
    const distanceFromBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceFromBottom <= 60) {
      handleLoadMore();
    }
  };

  return (
    <div
      className={composeDashboardClasses(
        'card',
        'dashboard-grid-span-1',
        'alerts-card',
      )}
    >
      <CardHeader
        icon={Bell}
        iconColor="var(--mui-palette-primary-400)"
        title={
          <div className={composeDashboardClasses('alerts-title-row')}>
            Active Alerts
            {unreadAlertCount > 0 && (
              <span className={composeDashboardClasses('alerts-count-badge')}>
                {unreadAlertCount}
              </span>
            )}
          </div>
        }
        rightElement={
          <div className={composeDashboardClasses('date-picker-wrapper')}>
            <button
              className={composeDashboardClasses(
                'flex-center',
                'border-btn',
                'text-xs',
              )}
              onClick={handleOpenDatePicker}
            >
              <Calendar size={14} />
              {formatFullDate(dateRange.start)} -{' '}
              {formatFullDate(dateRange.end)}
            </button>
          </div>
        }
      />

      <DateRangePickerPopover
        open={isDatePickerOpen}
        anchorEl={datePickerAnchorEl}
        fromDate={dateRange.start}
        toDate={dateRange.end}
        maxDate={new Date()}
        onClose={() => setDatePickerAnchorEl(null)}
        onApply={(start, end) => handleApplyDate(start, end)}
        formatDisplayDate={(isoDate: string) =>
          formatFullDate(new Date(`${isoDate}T00:00:00`))
        }
      />

      <div
        className={composeDashboardClasses('alerts-table-container')}
        onScroll={handleContainerScroll}
      >
        <table className={composeDashboardClasses('alerts-table')}>
          <colgroup>
            <col className={composeDashboardClasses('alerts-col-device')} />
            <col
              className={composeDashboardClasses('alerts-col-description')}
            />
            <col className={composeDashboardClasses('alerts-col-time')} />
          </colgroup>
          <thead>
            <tr className={composeDashboardClasses('text-xs')}>
              <th>Device / Title</th>
              <th>Description</th>
              <th className={composeDashboardClasses('alerts-time-header')}>
                Time
              </th>
            </tr>
          </thead>
          <tbody className={composeDashboardClasses('alerts-table-body')}>
            {filteredAlerts.map((alert) => (
              <tr
                key={alert.id}
                className={composeDashboardClasses(
                  alert.status === 'completed'
                    ? 'alert-row-completed'
                    : 'alert-row-active',
                  'alert-row-clickable',
                )}
                onClick={() => handleAlertClick(alert)}
              >
                <td>
                  <div className={composeDashboardClasses('alert-device-cell')}>
                    <span
                      className={composeDashboardClasses(
                        'tag',
                        'alerts-severity-tag',
                        alert.status === 'completed' && 'alert-badge-completed',
                        alert.status !== 'completed' &&
                          alert.severity === 'Critical' &&
                          'tag-red-outline',
                        alert.status !== 'completed' &&
                          alert.severity === 'Warning' &&
                          'tag-yellow-outline',
                        alert.status !== 'completed' &&
                          alert.severity !== 'Critical' &&
                          alert.severity !== 'Warning' &&
                          'tag-blue-outline',
                      )}
                    >
                      {alert.severity}
                    </span>
                    <span className={composeDashboardClasses('truncate')}>
                      {alert.device}
                    </span>
                  </div>
                </td>
                <td className={composeDashboardClasses('truncate')}>
                  {alert.desc}
                </td>
                <td className={composeDashboardClasses('alert-time-cell')}>
                  <div
                    className={composeDashboardClasses('alert-time-content')}
                  >
                    <Clock size={12} />
                    {alert.status === 'completed' ? (
                      <span
                        className={composeDashboardClasses(
                          'completed-alert-time',
                        )}
                      >
                        {alert.time}
                      </span>
                    ) : (
                      alert.time
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredAlerts.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className={composeDashboardClasses('alerts-empty-state')}
                >
                  No alerts found for the selected date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isLoadingMore && (
          <div className={composeDashboardClasses('alerts-empty-state')}>
            Loading more alerts...
          </div>
        )}
        {!hasMore && filteredAlerts.length > 0 && (
          <div className={composeDashboardClasses('alerts-empty-state')}>
            You have reached the end.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveAlertsCard;
