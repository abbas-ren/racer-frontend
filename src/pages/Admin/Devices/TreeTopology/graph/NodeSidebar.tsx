import { GraphNode } from 'typesCustom/treeTopology';
import { IDevice } from 'typesCustom/types';
import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Gen3InterfaceConnectionBoard from '../../Gen3DeviceInterface';
import HeartbeatTimerIndicator from '../../HeartbeatTimerIndicator';
import styles from './Graph.module.scss';
import {
  FCIcon,
  TerminalDisabled,
  TreeRtosDisabledIcon,
  TreeRtosIcon,
  TreeTerminalIcon,
} from 'assets/index';
import { DCIcon } from 'assets/index';
import {
  DeviceIcon,
  TreeNotAvailableIcon,
  TreeNodeAvailableIcon,
  TreeNodeBusyIcon,
  TreeNodeFaultyIcon,
} from 'assets/index';
import { DeviceState } from 'typesCustom/components';
import { CustomIcon } from 'components/common';
import { useSocketIoEvent } from 'hooks/useSocketIoEvent';
import type { RootState } from 'store';

type InterfaceCardStatus = 'connected' | 'not_connected' | 'not_available';

interface LiveSystemMetrics {
  cpu: { current: string; total: string; usagePercent: number };
  memory: { used: string; total: string; usagePercent: number };
  network: { upload: string; download: string };
  disk: { used: string; total: string; usagePercent: number };
  timestamp: string;
}

interface NodeNetworkInterface {
  name?: string;
  status?: string;
  signal_strength?: number;
  data_rate?: string;
}

interface NodePeripheral {
  id?: string | number;
  name?: string;
  type?: string;
  speed?: string;
  vendor?: string;
  device_id?: string;
}

interface SidebarNode extends GraphNode {
  description?: string;
  device_id?: string;
  last_seen?: string;
  uptime?: string;
  network_interfaces?: NodeNetworkInterface[];
  performance?: {
    cpu?: number;
    memory?: number;
    uptime?: number;
  };
  peripherals?: NodePeripheral[];
}

interface NodeSidebarProps {
  node: GraphNode | null;
  childrenNodes: GraphNode[];
  selectedDevice?: IDevice | null;
  heartbeatSeconds?: number;
  hasHeartbeat?: boolean;
  onOpenTerminal?: (
    target: string,
    deviceId: string,
    mode?: 'ssh' | 'rtos',
  ) => void;
  onClose: () => void;
}

const NodeSidebar = ({
  node,
  childrenNodes,
  selectedDevice = null,
  heartbeatSeconds = 0,
  hasHeartbeat = false,
  onOpenTerminal,
  onClose,
}: NodeSidebarProps) => {
  const [isInterfaceModalOpen, setIsInterfaceModalOpen] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveSystemMetrics | null>(
    null,
  );
  const heartbeatEntries = useSelector(
    (state: RootState) => state.heartbeat.heartbeats,
  );

  const isFarmControllerNode = node?.type === 'farm_controller';

  const handleMetricsUpdate = useCallback((payload: LiveSystemMetrics) => {
    setLiveMetrics(payload);
  }, []);

  useSocketIoEvent<LiveSystemMetrics>(
    'system_metrics_update',
    handleMetricsUpdate,
    { enabled: isFarmControllerNode },
  );

  const configuredInterfaces = useMemo(
    () => selectedDevice?.interfaces || [],
    [selectedDevice?.interfaces],
  );

  // Build a heartbeat-like data structure from device interfaces for Gen3InterfaceConnectionBoard
  const isDeviceAvailable =
    selectedDevice?.state === DeviceState.AVAILABLE ||
    selectedDevice?.state === DeviceState.BUSY;

  const interfaceHeartbeatData = useMemo(() => {
    if (configuredInterfaces.length === 0) return null;

    const grouped: Record<string, Record<string, { status: string }>> = {};
    for (const iface of configuredInterfaces) {
      const type = (iface.type || '').trim().toLowerCase();
      if (!type) continue;
      if (!grouped[type]) {
        grouped[type] = {};
      }
      grouped[type][iface.interfaceId || iface.name || `${type}_${iface.id}`] =
        {
          status: isDeviceAvailable
            ? iface.status || 'unknown'
            : 'not_available',
        };
    }
    return { data: grouped };
  }, [configuredInterfaces, isDeviceAvailable]);

  const interfaceCards = useMemo(() => {
    const mapStateToStatus = (
      state?: string,
    ): 'connected' | 'not_connected' | 'not_available' => {
      if (!isDeviceAvailable) return 'not_available';
      if (!state) return 'not_available';
      const normalized = state.trim().toLowerCase();
      if (['connected', 'up', 'plugged', 'available'].includes(normalized)) {
        return 'connected';
      }
      if (
        ['disconnected', 'down', 'unplugged', 'unknown'].includes(normalized)
      ) {
        return 'not_connected';
      }
      return 'not_available';
    };

    return configuredInterfaces.map((iface) => ({
      id: `${iface.type}:${iface.id}:${iface.interfaceId}`,
      name: iface.interfaceId || iface.name || 'N/A',
      type: iface.type,
      status: mapStateToStatus(iface.status),
    }));
  }, [configuredInterfaces, isDeviceAvailable]);

  const controllerHeartbeatKey =
    node?.type === 'device_controller'
      ? node.id?.startsWith('dc-')
        ? node.id.replace(/^dc-/, '')
        : node.id
      : null;
  const controllerHeartbeat = controllerHeartbeatKey
    ? heartbeatEntries[controllerHeartbeatKey]
    : null;
  const controllerMetrics = useMemo<LiveSystemMetrics | null>(() => {
    const payload = controllerHeartbeat?.data as
      | (Partial<LiveSystemMetrics> & { timestamp?: string })
      | undefined;

    if (
      !payload?.cpu ||
      !payload?.memory ||
      !payload?.network ||
      !payload?.disk
    ) {
      return null;
    }

    // Helper to format percent values to 2 decimal places
    const fmt = (v: any) => {
      const n = Number(v);
      return isNaN(n) ? 0 : Math.round(n * 100) / 100;
    };
    return {
      cpu: {
        current: payload.cpu.current || '--',
        total: payload.cpu.total || '--',
        usagePercent: fmt(payload.cpu.usagePercent),
      },
      memory: {
        used: payload.memory.used || '--',
        total: payload.memory.total || '--',
        usagePercent: fmt(payload.memory.usagePercent),
      },
      network: {
        upload: payload.network.upload || '--',
        download: payload.network.download || '--',
      },
      disk: {
        used: payload.disk.used || '--',
        total: payload.disk.total || '--',
        usagePercent: fmt(payload.disk.usagePercent),
      },
      timestamp:
        payload.timestamp ||
        (typeof controllerHeartbeat?.timestamp === 'string'
          ? controllerHeartbeat.timestamp
          : new Date().toISOString()),
    };
  }, [controllerHeartbeat]);

  if (!node) {
    return null;
  }

  const sidebarNode = node as SidebarNode;
  const terminalTarget = selectedDevice?.ipAddress || sidebarNode.ip || '';
  const deviceState = String(selectedDevice?.state ?? '').toLowerCase();
  const isFaultyOrNotReachable =
    deviceState === DeviceState.FAULTY ||
    deviceState === DeviceState.NOT_REACHABLE;
  const isPoweredOff =
    String(selectedDevice?.power ?? '').toLowerCase() === 'off';
  const isTerminalUnavailable =
    !terminalTarget ||
    terminalTarget === '0.0.0.0' ||
    isFaultyOrNotReachable ||
    isPoweredOff;
  const terminalDeviceId = String(
    selectedDevice?.deviceId ||
      sidebarNode.device_id ||
      sidebarNode.deviceId ||
      sidebarNode.id ||
      'N/A',
  );
  const deviceSignature = String(
    selectedDevice?.deviceType ?? '',
  ).toLowerCase();
  const isGen3Device =
    deviceSignature.includes('gen3') ||
    deviceSignature.includes('gen 3') ||
    deviceSignature.includes('Gen3') ||
    deviceSignature.includes('x3h') ||
    deviceSignature.includes('v3h');
  const isRtosUnavailable = isTerminalUnavailable || !selectedDevice?.deviceId;

  const clickOnSshTerminal = () => {
    if (node.type !== 'device') {
      return;
    }
    if (isTerminalUnavailable) {
      return;
    }
    onOpenTerminal?.(terminalTarget, terminalDeviceId, 'ssh');
  };

  const clickOnRtosTerminal = () => {
    if (node.type !== 'device') {
      return;
    }
    if (isRtosUnavailable) {
      return;
    }
    onOpenTerminal?.(terminalTarget, terminalDeviceId, 'rtos');
  };

  const getTimeAgo = (lastSeen?: string) => {
    if (!lastSeen) return 'Unknown';
    if (lastSeen.includes('ago')) return lastSeen;

    try {
      const now = new Date();
      const lastSeenDate = new Date(lastSeen);
      if (Number.isNaN(lastSeenDate.getTime())) return lastSeen;

      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 60) return `${diffSec} sec ago`;
      if (diffMin < 60) return `${diffMin} min ago`;
      if (diffHr < 24) return `${diffHr} hr ago`;
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } catch {
      return lastSeen;
    }
  };

  const deviceData = {
    name: sidebarNode.label || sidebarNode.id || 'Unknown Device',
    type: sidebarNode.description || 'Device Node',
    status: sidebarNode.status || 'Unknown',
    id:
      sidebarNode.device_id || sidebarNode.deviceId || sidebarNode.id || 'N/A',
    ip: sidebarNode.ip || '0.0.0.0',
    lastHeartbeat: getTimeAgo(sidebarNode.last_seen),
    uptime: sidebarNode.uptime || '0m',
    heartbeatTimer:
      selectedDevice?.heartbeatTimer ||
      (node.type === 'device_controller' ? 10 : 999),
    activePeripherals: (sidebarNode.peripherals || childrenNodes).map(
      (item, index) => {
        const peripheral = item as NodePeripheral;
        const child = item as GraphNode;
        return {
          id: peripheral.id || child.id || index,
          name: peripheral.name || child.label || 'Unknown Peripheral',
          type: peripheral.type || child.type || 'Generic Device',
          speed: peripheral.speed || '-',
          vendor: peripheral.vendor || peripheral.device_id || child.id || '-',
        };
      },
    ),
  };

  const topSectionTitle =
    node.type === 'device'
      ? selectedDevice?.deviceType || deviceData.type
      : deviceData.name;

  const shouldShowHeartbeatTimer =
    node.type === 'device' || node.type === 'device_controller';

  const heartbeatState = (() => {
    switch ((deviceData.status || '').toLowerCase()) {
      case 'busy':
        return DeviceState.BUSY;
      case 'faulty':
        return DeviceState.FAULTY;
      case 'not reachable':
        return DeviceState.NOT_REACHABLE;
      case 'available':
        return DeviceState.AVAILABLE;
      default:
        return DeviceState.UNKNOWN;
    }
  })();

  const activePeripheralItems = interfaceCards;

  const getStatusText = (
    status: 'connected' | 'not_connected' | 'not_available',
  ) => {
    if (status === 'connected') return 'Connected';
    if (status === 'not_connected') return 'Not Connected';
    return 'Not available';
  };

  const openInterfaceModal = () => setIsInterfaceModalOpen(true);
  const closeInterfaceModal = () => setIsInterfaceModalOpen(false);

  // Farm controller uses system_metrics_update (liveMetrics from AnalyticsService).
  // Device controller uses controllerMetrics (from controller heartbeat).
  // Never fall through from one source to the other.
  const activeMetrics =
    node.type === 'device_controller' ? controllerMetrics : liveMetrics;

  const systemMetrics = {
    cpu: {
      current: activeMetrics?.cpu.current ?? '--',
      total: activeMetrics?.cpu.total ?? '--',
      usagePercent: activeMetrics?.cpu.usagePercent ?? 0,
      icon: 'cpu' as const,
      color: '#7C3AED',
    },
    memory: {
      used: activeMetrics?.memory.used ?? '--',
      total: activeMetrics?.memory.total ?? '--',
      usagePercent: activeMetrics?.memory.usagePercent ?? 0,
      icon: 'memory-stick' as const,
      color: '#2563EB',
    },
    network: {
      upload: activeMetrics?.network.upload ?? '--',
      download: activeMetrics?.network.download ?? '--',
      icon: 'network' as const,
      color: '#22C55E',
    },
    disk: {
      used: activeMetrics?.disk.used ?? '--',
      total: activeMetrics?.disk.total ?? '--',
      usagePercent: activeMetrics?.disk.usagePercent ?? 0,
      icon: 'hard-drive' as const,
      color: '#F97316',
    },
  };

  const showSystemMetrics =
    node.type === 'farm_controller' || node.type === 'device_controller';

  return (
    <div className={`${styles.sidebar} ${styles.open}`}>
      <div className={styles.sidebarHeader}>
        <h2>Device Details</h2>
        <button className={styles.sidebarClose} type="button" onClick={onClose}>
          <CustomIcon name="x" size={16} />
        </button>
      </div>

      <div className={styles.sidebarContent}>
        <div className={styles.card}>
          {/* Section 1: Device Header */}
          <div
            className={`${styles.cardSection} ${
              node.type === 'device' ? styles.cardSectionDeviceHeader : ''
            }`}
          >
            <div className={styles.section1Content}>
              <div className={styles.deviceLogoGroup}>
                <div className={styles.deviceLogo}>
                  {node.type === 'farm_controller' && (
                    <FCIcon width={32} height={32} />
                  )}
                  {node.type === 'device_controller' && (
                    <DCIcon width={32} height={32} />
                  )}
                  {node.type === 'device' && (
                    <DeviceIcon width={32} height={32} />
                  )}
                </div>
                <div className={styles.deviceInfoGroup}>
                  <div className={styles.deviceTitle}>{topSectionTitle}</div>
                  <div className={styles.deviceSubtitle}>{deviceData.type}</div>
                </div>
                {shouldShowHeartbeatTimer && (
                  <div className={styles.heartbeatTimerWidget}>
                    <HeartbeatTimerIndicator
                      seconds={heartbeatSeconds}
                      hasHeartbeat={hasHeartbeat}
                      heartbeatTimeout={deviceData.heartbeatTimer}
                      state={selectedDevice?.state || heartbeatState}
                      size={34}
                      strokeWidth={5}
                    />
                  </div>
                )}
              </div>
              {node.type === 'device' && (
                <div className={styles.deviceActions}>
                  <button
                    className={styles.actionIconBtn}
                    type="button"
                    onClick={clickOnSshTerminal}
                    title="Open SSH Terminal"
                    disabled={isTerminalUnavailable}
                  >
                    <div className={styles.actionIconContainer}>
                      {isTerminalUnavailable ? (
                        <TerminalDisabled />
                      ) : (
                        <img
                          src={TreeTerminalIcon}
                          alt="Terminal"
                          width={18}
                          height={18}
                        />
                      )}
                    </div>
                  </button>
                  {!isGen3Device && (
                    <button
                      className={styles.actionIconBtn}
                      type="button"
                      onClick={clickOnRtosTerminal}
                      title="Open RTOS Terminal"
                      disabled={isRtosUnavailable}
                    >
                      <div className={styles.actionIconContainer}>
                        {isRtosUnavailable ? (
                          <img
                            src={TreeRtosDisabledIcon}
                            alt="RTOS disabled"
                            width={18}
                            height={18}
                          />
                        ) : (
                          <img
                            src={TreeRtosIcon}
                            alt="RTOS"
                            width={18}
                            height={18}
                          />
                        )}
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Status */}
          <div className={styles.cardSection}>
            <div className={styles.statusRowSection}>
              <span className={styles.statusLabelMain}>Current Status</span>
              {(() => {
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case 'Available':
                      return {
                        bg: '#4CAF50',
                        icon: TreeNodeAvailableIcon,
                      };
                    case 'Busy':
                      return {
                        bg: '#FFB222',
                        icon: TreeNodeBusyIcon,
                      };
                    case 'Faulty':
                      return {
                        bg: '#DE350B',
                        icon: TreeNodeFaultyIcon,
                      };
                    case 'Not Reachable':
                    default:
                      return {
                        bg: '#8E8E8E',
                        icon: TreeNotAvailableIcon,
                      };
                  }
                };

                const config = getStatusConfig(deviceData.status);

                return (
                  <div
                    className={styles.statusBadgeMain}
                    style={{ backgroundColor: config.bg }}
                  >
                    <img
                      src={config.icon}
                      alt="Status Icon"
                      style={{ width: '14px', height: '14px' }}
                    />
                    {deviceData.status}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Section 3: Details */}
          <div className={styles.cardSection}>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Device ID</div>
                <div className={styles.detailValue}>{deviceData.id}</div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>IP Address</div>
                <div className={styles.detailValue}>{deviceData.ip}</div>
              </div>
            </div>
          </div>
        </div>

        {showSystemMetrics && (
          <div className={styles.systemMetricsCard}>
            <div className={styles.systemMetricsHeader}>
              <span className={styles.systemMetricsTitle}>System Metrics</span>
              <span className={styles.systemMetricsLive}>
                <span className={styles.systemMetricsLiveDot} />
                Live
              </span>
            </div>

            {/* CPU */}
            <div className={styles.systemMetricItem}>
              <div className={styles.systemMetricIcon}>
                <CustomIcon
                  name={systemMetrics.cpu.icon}
                  size={20}
                  color={systemMetrics.cpu.color}
                />
              </div>
              <div className={styles.systemMetricBody}>
                <div className={styles.systemMetricTop}>
                  <span className={styles.systemMetricLabel}>CPU</span>
                  <span className={styles.systemMetricValue}>
                    {systemMetrics.cpu.usagePercent}%
                  </span>
                </div>
                <div className={styles.systemMetricSecondary}>
                  {systemMetrics.cpu.current} / {systemMetrics.cpu.total}
                </div>
                <div className={styles.systemMetricProgressTrack}>
                  <div
                    className={styles.systemMetricProgressFill}
                    style={{
                      width: `${systemMetrics.cpu.usagePercent}%`,
                      background: systemMetrics.cpu.color,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className={styles.systemMetricItem}>
              <div className={styles.systemMetricIcon}>
                <CustomIcon
                  name={systemMetrics.memory.icon}
                  size={20}
                  color={systemMetrics.memory.color}
                />
              </div>
              <div className={styles.systemMetricBody}>
                <div className={styles.systemMetricTop}>
                  <span className={styles.systemMetricLabel}>Memory</span>
                  <span className={styles.systemMetricValue}>
                    {systemMetrics.memory.usagePercent}%
                  </span>
                </div>
                <div className={styles.systemMetricSecondary}>
                  {systemMetrics.memory.used} / {systemMetrics.memory.total}
                </div>
                <div className={styles.systemMetricProgressTrack}>
                  <div
                    className={styles.systemMetricProgressFill}
                    style={{
                      width: `${systemMetrics.memory.usagePercent}%`,
                      background: systemMetrics.memory.color,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Network */}
            <div className={styles.systemMetricItem}>
              <div className={styles.systemMetricIcon}>
                <CustomIcon
                  name={systemMetrics.network.icon}
                  size={20}
                  color={systemMetrics.network.color}
                />
              </div>
              <div className={styles.systemMetricBody}>
                <div className={styles.systemMetricTop}>
                  <span className={styles.systemMetricLabel}>Network</span>
                </div>
                <div className={styles.systemMetricSecondary}>
                  ↑ {systemMetrics.network.upload}
                </div>
                <div className={styles.systemMetricSecondary}>
                  ↓ {systemMetrics.network.download}
                </div>
              </div>
            </div>

            {/* Disk */}
            <div className={styles.systemMetricItem}>
              <div className={styles.systemMetricIcon}>
                <CustomIcon
                  name={systemMetrics.disk.icon}
                  size={20}
                  color={systemMetrics.disk.color}
                />
              </div>
              <div className={styles.systemMetricBody}>
                <div className={styles.systemMetricTop}>
                  <span className={styles.systemMetricLabel}>Disk</span>
                  <span className={styles.systemMetricValue}>
                    {systemMetrics.disk.usagePercent}%
                  </span>
                </div>
                <div className={styles.systemMetricSecondary}>
                  {systemMetrics.disk.used} / {systemMetrics.disk.total}
                </div>
                <div className={styles.systemMetricProgressTrack}>
                  <div
                    className={styles.systemMetricProgressFill}
                    style={{
                      width: `${systemMetrics.disk.usagePercent}%`,
                      background: systemMetrics.disk.color,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {node.type === 'device' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>Interface Details</div>
            {selectedDevice ? (
              <div className={styles.interfaceDiagramContainer}>
                <div className={styles.interfaceDiagramHoverArea}>
                  <button
                    type="button"
                    className={`${styles.controlButton} ${styles.interfaceDiagramExpandButton}`}
                    onClick={openInterfaceModal}
                    aria-label="Expand interface details"
                  >
                    ⤢
                  </button>
                  <Gen3InterfaceConnectionBoard
                    device={selectedDevice}
                    heartbeat={interfaceHeartbeatData}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.emptyStateText}>
                Interface details are not available for this node.
              </div>
            )}

            <div
              className={`${styles.cardSubHeader} ${styles.cardSubHeaderNoDivider}`}
            >
              Active Peripherals
            </div>
            <div className={styles.interfaceCardsList}>
              {activePeripheralItems.map((item) => {
                const status: InterfaceCardStatus =
                  item.status || 'not_available';
                return (
                  <div
                    key={String(item.id || item.name)}
                    className={`${styles.interfaceCard} ${
                      status === 'not_available'
                        ? styles.interfaceCardUnavailable
                        : ''
                    }`}
                  >
                    <div className={styles.interfaceCardLeft}>
                      <span
                        className={`${styles.interfaceStatusDot} ${
                          status === 'connected'
                            ? styles.dotConnected
                            : styles.dotGrey
                        }`}
                      />
                      <span className={styles.interfaceName}>{item.name}</span>
                    </div>
                    <span
                      className={`${styles.interfaceStatusBadge} ${
                        status === 'connected'
                          ? styles.badgeConnected
                          : status === 'not_connected'
                            ? styles.badgeNotConnected
                            : styles.badgeNotAvailable
                      }`}
                    >
                      {getStatusText(status)}
                    </span>
                  </div>
                );
              })}
              {activePeripheralItems.length === 0 && (
                <div className={styles.emptyStateText}>
                  No interfaces available for this device.
                </div>
              )}
            </div>

            {/* <div className={styles.footerStats}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Active Interfaces</div>
              <div className={styles.statNumber}>
                {
                  (interfaceCards.length > 0
                    ? interfaceCards.filter((item) => item.status === 'connected').length
                    : 0)
                }
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Bus Types</div>
              <div className={styles.statNumber} style={{ color: '#3B82F6' }}>
                {new Set((selectedDevice?.interfaces || []).map((item) => item.type)).size || 0}
              </div>
            </div>
          </div> */}
          </div>
        )}

        {selectedDevice &&
          isInterfaceModalOpen &&
          createPortal(
            <div
              className={styles.interfaceModalOverlay}
              onClick={closeInterfaceModal}
              role="presentation"
            >
              <div
                className={styles.interfaceModal}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Interface details diagram"
              >
                <button
                  type="button"
                  className={styles.interfaceModalClose}
                  onClick={closeInterfaceModal}
                  aria-label="Close interface details"
                >
                  ×
                </button>
                <div className={styles.interfaceModalBody}>
                  <Gen3InterfaceConnectionBoard
                    device={selectedDevice}
                    heartbeat={interfaceHeartbeatData}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
};

export default NodeSidebar;
