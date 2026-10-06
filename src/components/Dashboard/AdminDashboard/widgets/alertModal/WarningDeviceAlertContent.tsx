import { AlertCircle, X } from 'lucide-react';
import { AlertItem, AlertModalConfig } from '../../types';
import { composeDashboardClasses } from '../../styles/dashboardStyles';

interface WarningDeviceAlertContentProps {
  selectedAlert: AlertItem;
  defaults: NonNullable<AlertModalConfig['defaults']>;
  warningConfig: NonNullable<AlertModalConfig['warning']>;
  onClose: () => void;
}

const WarningDeviceAlertContent = ({
  selectedAlert,
  defaults,
  warningConfig,
  onClose,
}: WarningDeviceAlertContentProps) => {
  return (
    <>
      <div
        className={composeDashboardClasses(
          'alert-modal-header',
          'alert-warning-yellow',
        )}
      >
        <AlertCircle size={20} color="var(--mui-palette-warning-main)" />
        <div className={composeDashboardClasses('alert-title-group')}>
          <h2>Alert Details - {selectedAlert.device}</h2>
          <div className={composeDashboardClasses('alert-timestamp')}>
            {selectedAlert.time}
          </div>
        </div>
        <button
          className={composeDashboardClasses('sidebar-close-btn')}
          onClick={onClose}
        >
          <X size={20} color="var(--mui-palette-text-secondary)" />
        </button>
      </div>

      <div className={composeDashboardClasses('alert-modal-content')}>
        <div className={composeDashboardClasses('modal-section')}>
          <h3 className={composeDashboardClasses('modal-section-title')}>
            Device Information
          </h3>
          <div className={composeDashboardClasses('device-info-row')}>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                DEVICE
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.device}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                IP ADDRESS
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.ipAddress || defaults.ipAddress || '-'}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                BUILD VERSION
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.buildVersion || defaults.buildVersion || '-'}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                DEVICE STATUS
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.deviceStatus ||
                  defaults.warningDeviceStatus ||
                  '-'}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                FAILED TESTS
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.failedTests ??
                  defaults.warningFailedTests ??
                  '-'}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                DEVICE CONTROLLER
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.deviceController ||
                  defaults.deviceController ||
                  '-'}
              </span>
            </div>
          </div>
        </div>

        <div
          className={composeDashboardClasses(
            'modal-section',
            'alert-details-section',
          )}
        >
          <div className={composeDashboardClasses('alert-details-grid')}>
            <div>
              <h3
                className={composeDashboardClasses(
                  'modal-section-title',
                  'modal-section-title-compact',
                )}
              >
                Alert Details
              </h3>
              <div
                className={composeDashboardClasses(
                  'alert-details-box',
                  'alert-warning-box',
                )}
              >
                <div className={composeDashboardClasses('alert-type-group')}>
                  <span className={composeDashboardClasses('alert-type-label')}>
                    ALERT TYPE
                  </span>
                  <span className={composeDashboardClasses('alert-type-value')}>
                    {selectedAlert.severity || warningConfig.severity || '-'}
                  </span>
                </div>
                <div className={composeDashboardClasses('alert-type-group')}>
                  <span className={composeDashboardClasses('alert-type-label')}>
                    FAILURE RATE
                  </span>
                  <div className={composeDashboardClasses('failure-rate-row')}>
                    <div
                      className={composeDashboardClasses(
                        'failure-rate-track-wrap',
                      )}
                    >
                      <div
                        className={composeDashboardClasses('failure-rate-bar')}
                      >
                        <div
                          className={composeDashboardClasses(
                            'failure-rate-fill',
                            'warning',
                          )}
                          style={{
                            width:
                              selectedAlert.failureRate ||
                              warningConfig.failureBarWidth ||
                              '0%',
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className={composeDashboardClasses('alert-type-value')}
                    >
                      {selectedAlert.failureRate ||
                        warningConfig.failureRate ||
                        '-'}
                    </span>
                  </div>
                </div>
                <div className={composeDashboardClasses('alert-type-group')}>
                  <span className={composeDashboardClasses('alert-type-label')}>
                    DESCRIPTION
                  </span>
                  <span className={composeDashboardClasses('alert-desc-text')}>
                    {selectedAlert.desc}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3
                className={composeDashboardClasses(
                  'modal-section-title',
                  'modal-section-title-compact',
                )}
              >
                Recommended Actions
              </h3>
              <div className={composeDashboardClasses('recommendations-box')}>
                <div
                  className={composeDashboardClasses('recommendations-header')}
                >
                  <AlertCircle
                    size={18}
                    color="var(--mui-palette-info-main)"
                    className={composeDashboardClasses('recommendations-icon')}
                  />
                  <span
                    className={composeDashboardClasses('recommendations-title')}
                  >
                    Recommended Actions
                  </span>
                </div>
                <ul className={composeDashboardClasses('recommendations-list')}>
                  {(warningConfig.recommendedActions || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={composeDashboardClasses('alert-modal-footer')}>
        <button
          className={composeDashboardClasses('close-btn')}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </>
  );
};

export default WarningDeviceAlertContent;
