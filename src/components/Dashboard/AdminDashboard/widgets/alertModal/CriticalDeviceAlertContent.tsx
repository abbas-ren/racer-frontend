import { AlertCircle, X } from 'lucide-react';
import { AlertItem, AlertModalConfig } from '../../types';
import { composeDashboardClasses } from '../../styles/dashboardStyles';

interface CriticalDeviceAlertContentProps {
  selectedAlert: AlertItem;
  defaults: NonNullable<AlertModalConfig['defaults']>;
  criticalConfig: NonNullable<AlertModalConfig['critical']>;
  onClose: () => void;
}

const CriticalDeviceAlertContent = ({
  selectedAlert,
  defaults,
  criticalConfig,
  onClose,
}: CriticalDeviceAlertContentProps) => {
  return (
    <>
      <div
        className={composeDashboardClasses(
          'alert-modal-header',
          'alert-critical',
        )}
      >
        <AlertCircle size={20} color="var(--mui-palette-error-main)" />
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
                  defaults.criticalDeviceStatus ||
                  '-'}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                FAILED TESTS
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.failedTests ??
                  defaults.criticalFailedTests ??
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
                  'alert-critical-box',
                )}
              >
                <div className={composeDashboardClasses('alert-type-group')}>
                  <span className={composeDashboardClasses('alert-type-label')}>
                    ALERT TYPE
                  </span>
                  <span className={composeDashboardClasses('alert-type-value')}>
                    {selectedAlert.severity || defaults.severity || '-'}
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
                          )}
                          style={{
                            width:
                              selectedAlert.failureRate ||
                              criticalConfig.failureBarWidth ||
                              '0%',
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className={composeDashboardClasses('alert-type-value')}
                    >
                      {selectedAlert.failureRate ||
                        criticalConfig.failureRate ||
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
                  {(criticalConfig.recommendedActions || []).map((item) => (
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

export default CriticalDeviceAlertContent;
