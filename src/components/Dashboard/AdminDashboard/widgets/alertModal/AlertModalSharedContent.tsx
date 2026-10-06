import { AlertCircle, X } from 'lucide-react';
import { AlertItem, AlertModalConfig } from '../../types';
import { composeDashboardClasses } from '../../styles/dashboardStyles';

interface FeedbackAlertContentPanelProps {
  selectedAlert: AlertItem;
  feedbackConfig: NonNullable<AlertModalConfig['feedback']>;
  onClose: () => void;
}

interface GenericAlertContentProps {
  selectedAlert: AlertItem;
  onClose: () => void;
}

export const FeedbackAlertContentPanel = ({
  selectedAlert,
  feedbackConfig,
  onClose,
}: FeedbackAlertContentPanelProps) => {
  return (
    <>
      <div
        className={composeDashboardClasses(
          'alert-modal-header',
          'alert-feedback',
        )}
      >
        <AlertCircle size={20} color="var(--mui-palette-text-muted)" />
        <h2>Feedback Details</h2>
        <button
          className={composeDashboardClasses('sidebar-close-btn')}
          onClick={onClose}
        >
          <X size={20} color="var(--mui-palette-text-secondary)" />
        </button>
      </div>

      <div className={composeDashboardClasses('alert-modal-content')}>
        <div
          className={composeDashboardClasses(
            'modal-section',
            'modal-section-no-top-padding',
          )}
        >
          <div className={composeDashboardClasses('feedback-meta-grid')}>
            <div>
              <span
                className={composeDashboardClasses(
                  'info-label',
                  'info-label-block',
                )}
              >
                SUBMITTED BY
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {feedbackConfig.submittedBy || '-'}
              </span>
            </div>
            <div>
              <span
                className={composeDashboardClasses(
                  'info-label',
                  'info-label-block',
                )}
              >
                CATEGORY
              </span>
              <span
                className={composeDashboardClasses('feedback-category-badge')}
              >
                {feedbackConfig.category || '-'}
              </span>
            </div>
            <div>
              <span
                className={composeDashboardClasses(
                  'info-label',
                  'info-label-block',
                )}
              >
                PRIORITY
              </span>
              <span
                className={composeDashboardClasses('feedback-priority-badge')}
              >
                {feedbackConfig.priority || '-'}
              </span>
            </div>
          </div>
        </div>

        <div className={composeDashboardClasses('modal-section')}>
          <h3 className={composeDashboardClasses('modal-section-title')}>
            Feedback
          </h3>
          <div className={composeDashboardClasses('feedback-box')}>
            <p>{feedbackConfig.message || selectedAlert.desc}</p>
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

export const GenericAlertContent = ({
  selectedAlert,
  onClose,
}: GenericAlertContentProps) => {
  return (
    <>
      <div
        className={composeDashboardClasses(
          'alert-modal-header',
          'alert-feedback',
        )}
      >
        <AlertCircle size={20} color="var(--mui-palette-text-secondary)" />
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
            Alert Information
          </h3>
          <div className={composeDashboardClasses('info-grid')}>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                SEVERITY
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.severity}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                STATUS
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.status}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                DEVICE
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.device}
              </span>
            </div>
          </div>
        </div>

        <div className={composeDashboardClasses('modal-section')}>
          <h3 className={composeDashboardClasses('modal-section-title')}>
            Description
          </h3>
          <div className={composeDashboardClasses('feedback-box')}>
            <p>{selectedAlert.desc}</p>
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
