import { AlertItem, AlertModalConfig } from '../../types';
import BuildIssueAlertContent from './BuildIssueAlertContent';
import CriticalDeviceAlertContent from './CriticalDeviceAlertContent';
import {
  FeedbackAlertContentPanel,
  GenericAlertContent,
} from './AlertModalSharedContent';
import WarningDeviceAlertContent from './WarningDeviceAlertContent';
import { composeDashboardClasses } from '../../styles/dashboardStyles';
import {
  downloadFaultyReportAttachment,
  downloadFaultyReportLogs,
} from 'services/reportIssueService';

interface AlertModalProps {
  selectedAlert: AlertItem | null;
  onClose: () => void;
  modalConfig: AlertModalConfig | null;
}

const triggerFileDownload = (
  content: string,
  fileName: string,
  mimeType: string,
): void => {
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
};

const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
};

const normalizeBuildReportDevice = (device?: string): string => {
  if (!device) return '-';
  const withoutPrefix = device.replace(/^Build Issue Report:\s*/i, '').trim();
  const [resolvedDevice] = withoutPrefix.split(' - ');
  return resolvedDevice?.trim() || withoutPrefix;
};

const resolveBuildVersion = (
  alertVersion?: string,
  fallbackVersion?: string,
  rawDevice?: string,
): string => {
  if (alertVersion) return alertVersion;
  if (fallbackVersion) return fallbackVersion;

  const match = rawDevice?.match(/-\s*(v[\w.-]+)$/i);
  return match?.[1] || '-';
};

const isBuildReportWarning = (alert: AlertItem): boolean => {
  return (
    alert.severity === 'Warning' &&
    (alert.device?.includes('Build Issue Report') ||
      alert.type === 'build' ||
      Boolean(alert.faultyReportId))
  );
};

const AlertModal = ({
  selectedAlert,
  onClose,
  modalConfig,
}: AlertModalProps) => {
  if (!selectedAlert) return null;

  const defaults = modalConfig?.defaults || {};
  const criticalConfig =
    modalConfig?.critical || ({} as NonNullable<AlertModalConfig['critical']>);
  const warningConfig =
    modalConfig?.warning || ({} as NonNullable<AlertModalConfig['warning']>);
  const buildReportConfig = modalConfig?.buildReport || {};
  const feedbackConfig = modalConfig?.feedback || {};

  const isFaultyReportAlert = Boolean(selectedAlert.faultyReportId);

  const testLogsContent = isFaultyReportAlert
    ? selectedAlert.testLogs || ''
    : selectedAlert.testLogs || modalConfig?.defaultTestLogs || '';

  const attachmentName =
    selectedAlert.attachmentName || defaults.attachmentName;

  const fallbackAttachment = (
    defaults.fallbackAttachmentTemplate ||
    'Network trace export for {{device}} ({{time}}).'
  )
    .replace('{{device}}', selectedAlert.device || 'device')
    .replace('{{time}}', selectedAlert.time || 'timestamp unavailable');

  const attachmentContent =
    selectedAlert.attachmentContent || fallbackAttachment;

  const canDownloadAttachment = isFaultyReportAlert
    ? Boolean(selectedAlert.filePath)
    : true;
  const canDownloadLogs = isFaultyReportAlert
    ? Boolean(selectedAlert.logsPath)
    : Boolean(testLogsContent);
  const showLogsSection = isFaultyReportAlert
    ? Boolean(selectedAlert.logsPath)
    : Boolean(testLogsContent);

  const normalizedBuildDevice = normalizeBuildReportDevice(
    selectedAlert.device,
  );
  const normalizedBuildVersion = resolveBuildVersion(
    selectedAlert.buildVersion,
    defaults.buildVersion,
    selectedAlert.device,
  );

  const handleDownloadAttachment = async () => {
    if (selectedAlert.faultyReportId && canDownloadAttachment) {
      try {
        const downloaded = await downloadFaultyReportAttachment(
          selectedAlert.faultyReportId,
        );
        triggerBlobDownload(
          downloaded.blob,
          downloaded.fileName || attachmentName,
        );
        return;
      } catch (error) {
        console.error('Failed to download faulty report attachment:', error);
      }
    }

    triggerFileDownload(
      attachmentContent,
      attachmentName,
      'application/octet-stream',
    );
  };

  const handleDownloadLogs = async () => {
    if (selectedAlert.faultyReportId && canDownloadLogs) {
      try {
        const downloaded = await downloadFaultyReportLogs(
          selectedAlert.faultyReportId,
        );
        triggerBlobDownload(downloaded.blob, downloaded.fileName);
        return;
      } catch (error) {
        console.error('Failed to download faulty report logs:', error);
      }
    }

    const logFileName = `${(selectedAlert.device || 'device')
      .replace(/\s+/g, '-')
      .toLowerCase()}-test-logs.txt`;

    triggerFileDownload(
      testLogsContent,
      logFileName,
      'text/plain;charset=utf-8',
    );
  };

  return (
    <div
      className={composeDashboardClasses('sidebar-backdrop')}
      onClick={onClose}
    >
      <div
        className={composeDashboardClasses('alert-modal-container')}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedAlert.severity === 'Critical' && (
          <CriticalDeviceAlertContent
            selectedAlert={selectedAlert}
            defaults={defaults}
            criticalConfig={criticalConfig}
            onClose={onClose}
          />
        )}

        {isBuildReportWarning(selectedAlert) && (
          <BuildIssueAlertContent
            selectedAlert={selectedAlert}
            buildReportConfig={buildReportConfig}
            normalizedBuildDevice={normalizedBuildDevice}
            normalizedBuildVersion={normalizedBuildVersion}
            attachmentName={attachmentName}
            testLogsContent={testLogsContent}
            onDownloadAttachment={handleDownloadAttachment}
            onDownloadLogs={handleDownloadLogs}
            canDownloadAttachment={canDownloadAttachment}
            canDownloadLogs={canDownloadLogs}
            showLogsSection={showLogsSection}
            onClose={onClose}
          />
        )}

        {selectedAlert.severity === 'Warning' &&
          !isBuildReportWarning(selectedAlert) && (
            <WarningDeviceAlertContent
              selectedAlert={selectedAlert}
              defaults={defaults}
              warningConfig={warningConfig}
              onClose={onClose}
            />
          )}

        {selectedAlert.severity === 'Feedback' && (
          <FeedbackAlertContentPanel
            selectedAlert={selectedAlert}
            feedbackConfig={feedbackConfig}
            onClose={onClose}
          />
        )}

        {selectedAlert.severity !== 'Critical' &&
          selectedAlert.severity !== 'Warning' &&
          selectedAlert.severity !== 'Feedback' && (
            <GenericAlertContent
              selectedAlert={selectedAlert}
              onClose={onClose}
            />
          )}
      </div>
    </div>
  );
};

export default AlertModal;
