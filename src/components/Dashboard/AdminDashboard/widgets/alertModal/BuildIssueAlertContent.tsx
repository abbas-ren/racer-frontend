import { AlertCircle, X } from 'lucide-react';
import downloadIcon from '../../../../../assets/download-icon.png';
import { AlertItem, AlertModalConfig } from '../../types';
import { composeDashboardClasses } from '../../styles/dashboardStyles';

interface BuildIssueAlertContentProps {
  selectedAlert: AlertItem;
  buildReportConfig: NonNullable<AlertModalConfig['buildReport']>;
  normalizedBuildDevice: string;
  normalizedBuildVersion: string;
  attachmentName: string;
  testLogsContent: string;
  onDownloadAttachment: () => void;
  onDownloadLogs: () => void;
  canDownloadAttachment: boolean;
  canDownloadLogs: boolean;
  showLogsSection: boolean;
  onClose: () => void;
}

const BuildIssueAlertContent = ({
  selectedAlert,
  buildReportConfig,
  normalizedBuildDevice,
  normalizedBuildVersion,
  attachmentName,
  testLogsContent,
  onDownloadAttachment,
  onDownloadLogs,
  canDownloadAttachment,
  canDownloadLogs,
  showLogsSection,
  onClose,
}: BuildIssueAlertContentProps) => {
  return (
    <>
      <div
        className={composeDashboardClasses(
          'alert-modal-header',
          'alert-warning-orange',
        )}
      >
        <div
          className={composeDashboardClasses('alert-header-icon', 'warning')}
        >
          <AlertCircle size={20} color="var(--mui-palette-warning2-main)" />
        </div>
        <div className={composeDashboardClasses('alert-title-group')}>
          <h2>Build Report Details</h2>
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
            Build Report Information
          </h3>
          <div className={composeDashboardClasses('build-report-info-grid')}>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                DEVICE FAMILY
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.deviceFamily ||
                  buildReportConfig.deviceFamily ||
                  '-'}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                DEVICE
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.device || normalizedBuildDevice}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                BUILD VERSION
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.buildVersion || normalizedBuildVersion}
              </span>
            </div>
            <div className={composeDashboardClasses('info-item')}>
              <span className={composeDashboardClasses('info-label')}>
                SUBMITTED BY
              </span>
              <span className={composeDashboardClasses('info-value')}>
                {selectedAlert.submittedBy ||
                  buildReportConfig.submittedBy ||
                  '-'}
              </span>
            </div>
          </div>
        </div>

        <div className={composeDashboardClasses('modal-section')}>
          <h3 className={composeDashboardClasses('modal-section-title')}>
            Issue Description
          </h3>
          <div className={composeDashboardClasses('issue-desc-box')}>
            <p>{selectedAlert.desc || buildReportConfig.description || '-'}</p>
          </div>
        </div>

        <div className={composeDashboardClasses('modal-section')}>
          <h3 className={composeDashboardClasses('modal-section-title')}>
            Attached Files
          </h3>
          <div className={composeDashboardClasses('attached-files-box')}>
            <div className={composeDashboardClasses('file-item')}>
              <span className={composeDashboardClasses('file-item-name')}>
                {attachmentName}
              </span>
              <button
                className={composeDashboardClasses('download-icon-btn')}
                aria-label={`Download ${attachmentName}`}
                onClick={onDownloadAttachment}
                disabled={!canDownloadAttachment}
              >
                <img
                  src={downloadIcon}
                  alt="Download"
                  className={composeDashboardClasses('download-icon-image')}
                />
              </button>
            </div>
          </div>
        </div>

        {showLogsSection && (
          <div className={composeDashboardClasses('modal-section')}>
            <div className={composeDashboardClasses('test-logs-header')}>
              <h3
                className={composeDashboardClasses(
                  'modal-section-title',
                  'modal-section-title-no-margin',
                )}
              >
                Test Logs
              </h3>
              <button
                className={composeDashboardClasses('download-logs-btn')}
                aria-label="Download logs"
                onClick={onDownloadLogs}
                disabled={!canDownloadLogs}
              >
                <img
                  src={downloadIcon}
                  alt=""
                  aria-hidden="true"
                  className={composeDashboardClasses('download-icon-image')}
                />
                <span>Download Logs</span>
              </button>
            </div>
            <div className={composeDashboardClasses('test-logs-box')}>
              <pre className={composeDashboardClasses('test-logs-content')}>
                {testLogsContent}
              </pre>
            </div>
          </div>
        )}
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

export default BuildIssueAlertContent;
