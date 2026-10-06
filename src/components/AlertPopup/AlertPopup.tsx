import React from 'react';
import {
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Popover,
  Pagination,
} from '@mui/material';
import { Circle as CircleIcon, Close as CloseIcon } from '@mui/icons-material';
import styles from './AlertsAlarmsPopup.module.scss';
import type { Alerts } from 'store/types/sagaTypes';
import { capitalizeWords, formatDateTime } from 'utils/common';
import clsx from 'clsx';
import { ErrorIcon, WarningIcon } from 'assets/index';

export enum AlertType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

interface AlertsAlarmsPopupProps {
  open: boolean;
  onClose: () => void;
  alerts: Alerts[];
  title?: string;
  anchorEl?: HTMLElement | null;
  handleClick: (id: string) => void;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  markAllRead: () => void;
  totalUnread: number;
}

const AlertsAlarmsPopup: React.FC<AlertsAlarmsPopupProps> = ({
  open,
  onClose,
  alerts,
  title = 'Alerts & Alarms',
  anchorEl,
  handleClick,
  page,
  totalPages,
  setPage,
  markAllRead,
  totalUnread,
}) => {
  const getIcon = (severity: string) => {
    switch (severity) {
      case AlertType.ERROR:
        return (
          <img className={styles.alert_icon} src={ErrorIcon} alt="alert" />
        );
      case AlertType.WARNING:
        return (
          <img className={styles.alert_icon} src={WarningIcon} alt="alert" />
        );
      default:
        return (
          <img className={styles.alert_icon} src={WarningIcon} alt="alert" />
        );
    }
  };

  const getStatusDot = (status: string) => {
    const statusClass = status.toLowerCase().replace(/\s+/g, '');
    return (
      <CircleIcon
        className={`${styles.statusDot} ${styles[`statusDot${statusClass}`]}`}
      />
    );
  };

  const getDeviceStatus = (message: string) => {
    return capitalizeWords(
      message.split(' ').slice(3).join(' ').replace('_', ' '),
    );
  };

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      classes={{ paper: styles.popoverPaper }}
    >
      <div className={styles.popupContainer}>
        <div className={clsx(styles.header, 'flex flex-between')}>
          <Typography variant="h6" className={styles.title}>
            {title}
          </Typography>
          <div className="flex flex-gap-sm flex-items-center ">
            <p
              onClick={() => {
                if (totalUnread !== 0) markAllRead();
              }}
              className={clsx(
                styles.read_all_text,
                totalUnread === 0 ? styles.pointer_none : '',
              )}
            >
              Read all
            </p>
            <IconButton
              onClick={onClose}
              size="small"
              className={styles.closeButton}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </div>

        <div className={styles.content}>
          {alerts.length === 0 ? (
            <div className={styles.emptyState}>
              <Typography className={styles.emptyStateText}>
                No alerts or alarms to display
              </Typography>
            </div>
          ) : (
            <List className={styles.alertsList}>
              {alerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <div
                    className="cursor-pointer"
                    onClick={() => handleClick(alert.id)}
                  >
                    <div className="flex flex-between p-t-md p-l-md p-r-md">
                      <ListItemText
                        secondary={
                          <Typography className={styles.odd_text}>
                            {formatDateTime(new Date(alert.createdAt))}
                          </Typography>
                        }
                      />
                      {!alert.isRead && (
                        <Box
                          className={clsx(
                            styles.statusDotContainer,
                            'flex flex-center',
                          )}
                          accessKey={alert.type}
                        >
                          {getStatusDot(alert.status)}
                        </Box>
                      )}
                    </div>

                    <ListItem>
                      <ListItemIcon className={styles.listItemIcon}>
                        {getIcon(alert.type)}
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box
                            className={clsx(
                              styles.alertContent,
                              'flex flex-items-center',
                            )}
                          >
                            <Typography
                              className={clsx(
                                styles.deviceInfo,
                                alert.isRead
                                  ? styles.read_text
                                  : styles.unread_text,
                              )}
                            >
                              Device - {alert.data?.deviceId}
                            </Typography>
                            <Typography
                              className={
                                alert.isRead
                                  ? styles.read_text
                                  : styles.unread_text
                              }
                            >
                              is
                            </Typography>
                            <Typography
                              className={styles.device_status}
                              accessKey={alert.type}
                            >
                              {getDeviceStatus(alert.message)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>

                    {index < alerts.length - 1 && (
                      <Divider
                        variant="inset"
                        component="li"
                        className={styles.divider}
                      />
                    )}
                  </div>
                </React.Fragment>
              ))}
            </List>
          )}
        </div>

        {/* {alerts.length > 0 && totalPages > 1 && ( */}
        <Box className={styles.paginationContainer}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size="small"
            siblingCount={0}
            boundaryCount={1}
          />
        </Box>
        {/* )} */}
      </div>
    </Popover>
  );
};

export default AlertsAlarmsPopup;
