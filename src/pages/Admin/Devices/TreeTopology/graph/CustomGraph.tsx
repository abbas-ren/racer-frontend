import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'radash';
import styles from './Graph.module.scss';
import { layoutFromApiResponse } from 'utils/layoutEngine';
import Node from './Node';
import Edge from './Edge';
import NodeSidebar from './NodeSidebar';
import SSHTerminalBar from 'components/Terminal/SSHTeminalBar';
import SSHTerminalComponent from 'components/Terminal/SSHTerminal';
import RTOSTerminalComponent from 'components/Terminal/RTOSTerminal';
import {
  clearGraphSelection,
  fetchTreeTopologyDataRequest,
  fetchLastHeartbeatRequest,
  selectTreeTopologyState,
  setGraphActiveDropdown,
  setGraphCollapsedControllers,
  setGraphData,
  setGraphHighlightedPath,
  setGraphHoveredNodeId,
  setGraphIsPanning,
  setGraphSearchQuery,
  setGraphSelectedNodeId,
  setGraphSidebarNodeId,
  setGraphTransform,
  updateGraphTransform,
  selectControllers,
  selectDevices,
  fetchSidebarDeviceRequest,
  clearSidebarDevice,
  selectSidebarDevice,
} from 'store/slices';
import { GraphNode } from 'typesCustom/treeTopology';
import { IDevice } from 'typesCustom/types';
import { DeviceStatus } from 'typesCustom/components';
import type { ControllerRow } from 'types/configuration';
import { useHeartbeatManager } from 'hooks/useHeartbeatManager';
import { useDeviceInterfaceSocket } from 'hooks/useDeviceInterfaceSocket';
import { useAuth } from 'hooks/useAuth';
import { useSocketIoEvent } from 'hooks/useSocketIoEvent';
import { FARM_CONTROLLER_HOST } from 'constants/config';
import {
  FCIcon,
  TreeBusyIcon,
  TreeFaultyIcon,
  TreeIdIcon,
  TreeNetIcon,
  TreeNotAvailableIcon,
} from 'assets/index';
import { DCIcon } from 'assets/index';
import {
  DeviceIcon,
  TreeAvailableIcon,
  TopologyActiveIcon,
  DevicePassiveIcon,
} from 'assets/index';

const MIN_K = 0.25;
const MAX_K = 3;
const ZOOM_STEP = 0.1;
const FARM_CONTROLLER_STATIC_IP = FARM_CONTROLLER_HOST;
type DeviceTerminalMode = 'ssh' | 'rtos';

const mapDeviceStateToGraphStatus = (state?: string): string => {
  switch (state) {
    case 'free':
      return 'Available';
    case 'busy':
      return 'Busy';
    case 'faulty':
      return 'Faulty';
    case 'not_reachable':
      return 'Not Reachable';
    default:
      return 'Available';
  }
};

const mapControllerStatusToGraphStatus = (status?: string): string => {
  switch (String(status ?? '').toLowerCase()) {
    case 'offline':
      return 'Not Reachable';
    case 'online':
    default:
      return 'Available';
  }
};

const buildGraphFromDevices = (
  devices: IDevice[],
  controllerRows: ControllerRow[],
): {
  nodes: GraphNode[];
  edges: { id: string; source: string; target: string }[];
} => {
  const approvedDevices = devices.filter(
    (device) => device.status === DeviceStatus.APPROVED,
  );

  const normalizeMac = (macAddress?: string): string =>
    String(macAddress ?? '')
      .replace(/[^a-fA-F0-9]/g, '')
      .toUpperCase();

  const isGen5Device = (device: IDevice): boolean => {
    const deviceFamily = String(
      (device as IDevice & { deviceFamily?: string }).deviceFamily ?? '',
    );
    const signature =
      `${deviceFamily} ${device.deviceType ?? ''}`.toLowerCase();
    return (
      signature.includes('gen3') ||
      signature.includes('gen 3') ||
      signature.includes('gen5') ||
      signature.includes('gen 5') ||
      signature.includes('x5h') ||
      signature.includes('h3') ||
      signature.includes('m3-n') ||
      signature.includes('d3')
    );
  };

  // Create a map of controller IDs from configuration
  const controllerMap = new Map<string, ControllerRow>();
  controllerRows.forEach((controller) => {
    controllerMap.set(String(controller.controllerId), controller);
  });

  const mappedMacToControllerId = new Map<string, string>();
  controllerRows.forEach((controller) => {
    const controllerId = String(controller.controllerId);
    const mappings = controller.mappings ?? {};
    Object.keys(mappings).forEach((rawMac) => {
      const normalized = normalizeMac(rawMac);
      if (normalized) {
        mappedMacToControllerId.set(normalized, controllerId);
      }
    });
  });

  const getDirectDeviceControllerId = (device: IDevice): string | null => {
    if (!device.controllerId) {
      return null;
    }

    // Handle if controllerId is an object with an id property
    if (
      typeof device.controllerId === 'object' &&
      'id' in device.controllerId
    ) {
      return String(device.controllerId.id);
    }

    // Handle if controllerId is already a string or number
    if (
      typeof device.controllerId === 'string' ||
      typeof device.controllerId === 'number'
    ) {
      return String(device.controllerId);
    }

    return null;
  };

  // For Gen5 devices, use controller mappings as source of truth.
  const getResolvedControllerId = (device: IDevice): string | null => {
    if (isGen5Device(device)) {
      const normalizedDeviceMac = normalizeMac(device.macAddress);
      if (!normalizedDeviceMac) {
        return null;
      }
      return mappedMacToControllerId.get(normalizedDeviceMac) ?? null;
    }

    return getDirectDeviceControllerId(device);
  };

  // Filter approved devices to only include those with valid controllers
  const validDevices = approvedDevices.filter((device) => {
    const controllerId = getResolvedControllerId(device);
    if (!controllerId) {
      return false;
    }
    return controllerMap.has(controllerId);
  });

  const farmNode: GraphNode = {
    id: 'farm-1',
    label: 'Farm Controller',
    type: 'farm_controller',
    x: 0,
    y: 0,
    status: 'Available',
    ip: FARM_CONTROLLER_STATIC_IP,
  };

  const controllerNodeMap = new Map<string, GraphNode>();
  const deviceNodes: GraphNode[] = [];

  // Create controller nodes from the configuration controllers
  controllerRows.forEach((controller) => {
    const controllerId = String(controller.controllerId);
    controllerNodeMap.set(controllerId, {
      id: `dc-${controllerId}`,
      label: controller.controllerName || `Device Controller ${controllerId}`,
      type: 'device_controller',
      parentId: farmNode.id,
      x: 0,
      y: 0,
      status: mapControllerStatusToGraphStatus(controller.status),
      ip: controller.ipAddress,
    });
  });

  // Create device nodes for valid devices
  validDevices.forEach((device) => {
    const controllerId = getResolvedControllerId(device);
    if (!controllerId) {
      return;
    }

    const dcControllerId = `dc-${controllerId}`;

    deviceNodes.push({
      id: `dev-${device.deviceId}`,
      label: device.deviceType || device.deviceName || device.deviceId,
      type: 'device',
      parentId: dcControllerId,
      x: 0,
      y: 0,
      status: mapDeviceStateToGraphStatus(device.state),
      ip: device.ipAddress,
      deviceId: device.deviceId,
    });
  });

  const controllerNodes = Array.from(controllerNodeMap.values());

  const edges = [
    ...controllerNodes.map((controller) => ({
      id: `e-${farmNode.id}-${controller.id}`,
      source: farmNode.id,
      target: controller.id,
    })),
    ...deviceNodes.map((device) => ({
      id: `e-${device.parentId}-${device.id}`,
      source: device.parentId || 'unknown',
      target: device.id,
    })),
  ];

  return {
    nodes: [farmNode, ...controllerNodes, ...deviceNodes],
    edges,
  };
};

interface CustomGraphProps {
  onSwitchToDevices?: () => void;
}

const CustomGraph = ({ onSwitchToDevices }: CustomGraphProps) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const userId = user?.id || '';
  const [terminalTarget, setTerminalTarget] = useState<string | null>(null);
  const [terminalDeviceId, setTerminalDeviceId] = useState<string | null>(null);
  const [terminalMode, setTerminalMode] = useState<DeviceTerminalMode | null>(
    null,
  );
  const [isTreeIndicatorActive, setIsTreeIndicatorActive] = useState(false);
  const switchTimeoutRef = useRef<number | null>(null);
  const { heartbeatTimers, deviceHeartbeatStatus } = useHeartbeatManager();
  const devices = useSelector(selectDevices);
  const controllerRows = useSelector(selectControllers);
  const sidebarDeviceDetail = useSelector(selectSidebarDevice);
  const {
    graphNodes: nodes,
    graphEdges: edges,
    graphTransform: transform,
    graphIsPanning: isPanning,
    graphSidebarNodeId: sidebarNodeId,
    graphSearchQuery: searchQuery,
    graphHighlightedPath: highlightedPath,
    graphSelectedNodeId: selectedNodeId,
    graphHoveredNodeId: hoveredNodeId,
    graphCollapsedControllers: collapsedControllers,
    graphActiveDropdown: activeDropdown,
  } = useSelector(selectTreeTopologyState);

  const highlightedPathSet = useMemo(
    () => new Set(highlightedPath),
    [highlightedPath],
  );
  const collapsedControllersSet = useMemo(
    () => new Set(collapsedControllers),
    [collapsedControllers],
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    dispatch(fetchTreeTopologyDataRequest());
  }, [dispatch]);

  useEffect(() => {
    const graphData = buildGraphFromDevices(
      Array.isArray(devices) ? devices : [],
      controllerRows,
    );
    const laidOutNodes = layoutFromApiResponse(graphData.nodes);
    dispatch(setGraphData({ nodes: laidOutNodes, edges: graphData.edges }));
  }, [devices, controllerRows, dispatch]);

  // Memoized refetch function with debounce to handle frequent WebSocket events
  const refetchTreeTopology = useMemo(
    () =>
      debounce({ delay: 300 }, () => {
        dispatch(fetchTreeTopologyDataRequest());
      }),
    [dispatch],
  );

  useSocketIoEvent<{
    action: 'added' | 'updated' | 'deleted';
    controllerId: string;
  }>(
    'device_controller_changed',
    () => {
      refetchTreeTopology();
    },
    {
      userId,
      enabled: Boolean(userId),
    },
  );

  useSocketIoEvent<{ deviceId: string; changedAt: string; state: string }>(
    'device_state_update',
    () => {
      refetchTreeTopology();
    },
    {
      userId,
      enabled: Boolean(userId),
    },
  );

  useSocketIoEvent<{
    deviceId: string;
    power: 'on' | 'off';
    changedAt: string;
  }>(
    'device_power_update',
    () => {
      refetchTreeTopology();
    },
    {
      userId,
      enabled: Boolean(userId),
    },
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target && !target.closest(`.${styles.dropdownContainer}`)) {
        dispatch(setGraphActiveDropdown(null));
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dispatch]);

  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (node.type === 'device' && node.parentId) {
        return !collapsedControllersSet.has(node.parentId);
      }
      return true;
    });
  }, [nodes, collapsedControllersSet]);

  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    return edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
    );
  }, [edges, visibleNodes]);

  const allControllers = useMemo(
    () => nodes.filter((node) => node.type === 'device_controller'),
    [nodes],
  );

  const sidebarNode = useMemo(
    () => nodes.find((node) => node.id === sidebarNodeId) || null,
    [nodes, sidebarNodeId],
  );

  const sidebarDevice = sidebarDeviceDetail;

  // Fetch full device details (with interfaces) when sidebar opens for a device node
  useEffect(() => {
    if (sidebarNode?.type === 'device' && sidebarNode.deviceId) {
      dispatch(fetchSidebarDeviceRequest({ deviceId: sidebarNode.deviceId }));
    } else {
      dispatch(clearSidebarDevice());
    }
  }, [sidebarNode, dispatch]);

  const sidebarHeartbeatId = useMemo(() => {
    if (!sidebarNode) {
      return null;
    }

    if (sidebarNode.type === 'device') {
      return sidebarDevice?.deviceId || sidebarNode.deviceId || sidebarNode.id;
    }

    if (sidebarNode.type === 'device_controller') {
      return sidebarNode.id.startsWith('dc-')
        ? sidebarNode.id.replace(/^dc-/, '')
        : sidebarNode.id;
    }

    return null;
  }, [sidebarNode, sidebarDevice]);

  const sidebarHeartbeatSeconds = sidebarHeartbeatId
    ? heartbeatTimers?.[sidebarHeartbeatId] || 0
    : 0;

  const sidebarHasHeartbeat = sidebarHeartbeatId
    ? deviceHeartbeatStatus?.[sidebarHeartbeatId] || false
    : false;

  // Join/leave socket.io room for per-device interface updates
  useDeviceInterfaceSocket(
    sidebarHeartbeatId,
    userId,
    sidebarNode?.type === 'device_controller' ? 'device_controller' : 'device',
  );

  // Fetch last heartbeat for device_controller nodes (device nodes get it via fetchSidebarDeviceRequest saga)
  useEffect(() => {
    if (!sidebarHeartbeatId || sidebarNode?.type === 'device') {
      return;
    }
    const timeout = sidebarDevice?.heartbeatTimer || 999;
    dispatch(
      fetchLastHeartbeatRequest({ deviceId: sidebarHeartbeatId, timeout }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarHeartbeatId, dispatch]);

  const hoveredNode = useMemo(
    () => nodes.find((node) => node.id === hoveredNodeId) || null,
    [nodes, hoveredNodeId],
  );

  useEffect(() => {
    if (!searchQuery) {
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const matchingNodes = nodes.filter((node) =>
      (node.label || node.id).toLowerCase().includes(lowerQuery),
    );

    if (matchingNodes.length === 0) {
      dispatch(setGraphHighlightedPath([]));
      return;
    }

    const newPathSet = new Set<string>();
    const controllersToExpand = new Set<string>();

    matchingNodes.forEach((node) => {
      newPathSet.add(node.id);
      if (node.type === 'device' && node.parentId) {
        controllersToExpand.add(node.parentId);
      }

      let current: GraphNode | undefined = node;
      while (current.parentId) {
        const edge = edges.find(
          (item) =>
            item.source === current?.parentId && item.target === current?.id,
        );
        if (edge) {
          newPathSet.add(edge.id);
        }

        const parent = nodes.find((item) => item.id === current?.parentId);
        if (!parent) {
          break;
        }

        newPathSet.add(parent.id);
        current = parent;
      }
    });

    if (controllersToExpand.size > 0) {
      // Expand all controllers that contain search results
      dispatch(setGraphCollapsedControllers([]));
    }

    dispatch(setGraphHighlightedPath(Array.from(newPathSet)));
  }, [searchQuery, nodes, edges, dispatch]);

  useEffect(() => {
    if (!searchQuery && !selectedNodeId) {
      dispatch(setGraphHighlightedPath([]));
    }
  }, [searchQuery, selectedNodeId, dispatch]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsTreeIndicatorActive(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []);

  const handleSwitchToDevices = useCallback(() => {
    if (!onSwitchToDevices) {
      return;
    }

    setIsTreeIndicatorActive(false);

    if (switchTimeoutRef.current) {
      window.clearTimeout(switchTimeoutRef.current);
    }

    switchTimeoutRef.current = window.setTimeout(() => {
      onSwitchToDevices();
    }, 280);
  }, [onSwitchToDevices]);

  const fitView = () => {
    if (visibleNodes.length === 0) {
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    visibleNodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    const padding = 120;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / graphWidth;
    const scaleY = viewportHeight / graphHeight;
    const k = Math.max(MIN_K, Math.min(scaleX, scaleY, 1));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    dispatch(
      setGraphTransform({
        x: viewportWidth / 2 - centerX * k,
        y: viewportHeight / 2 - centerY * k,
        k,
      }),
    );
  };

  useEffect(() => {
    if (nodes.length > 0) {
      fitView();
    }
  }, [nodes.length]);

  const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
  };

  const zoomIn = () => {
    const nextK = clamp(+(transform.k + ZOOM_STEP).toFixed(2), MIN_K, MAX_K);
    dispatch(updateGraphTransform({ k: nextK }));
  };

  const zoomOut = () => {
    const nextK = clamp(+(transform.k - ZOOM_STEP).toFixed(2), MIN_K, MAX_K);
    dispatch(updateGraphTransform({ k: nextK }));
  };

  const resetView = () => {
    dispatch(
      setGraphTransform({
        x: window.innerWidth / 2,
        y: 100,
        k: 1,
      }),
    );
    dispatch(clearGraphSelection());
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) {
      return;
    }

    canvasRef.current.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    lastPosRef.current = { x: event.clientX, y: event.clientY };
    startPosRef.current = { x: event.clientX, y: event.clientY };
    dispatch(setGraphIsPanning(true));
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || pointerIdRef.current !== event.pointerId) {
      return;
    }

    const dx = event.clientX - lastPosRef.current.x;
    const dy = event.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: event.clientX, y: event.clientY };

    dispatch(
      setGraphTransform({
        ...transform,
        x: transform.x + dx,
        y: transform.y + dy,
      }),
    );
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) {
      return;
    }

    try {
      canvasRef.current.releasePointerCapture(event.pointerId);
    } catch (_error) {
      // no-op
    }

    pointerIdRef.current = null;
    dispatch(setGraphIsPanning(false));

    const dx = event.clientX - startPosRef.current.x;
    const dy = event.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 5) {
      dispatch(clearGraphSelection());
    }
  };

  const focusOnNode = (node: GraphNode) => {
    dispatch(setGraphSidebarNodeId(node.id));
    dispatch(setGraphSelectedNodeId(node.id));

    const pathSet = new Set<string>();
    pathSet.add(node.id);

    let current: GraphNode | undefined = node;
    while (current.parentId) {
      const edge = edges.find(
        (item) =>
          item.source === current?.parentId && item.target === current?.id,
      );
      if (edge) {
        pathSet.add(edge.id);
      }

      const parent = nodes.find((item) => item.id === current?.parentId);
      if (!parent) {
        break;
      }
      pathSet.add(parent.id);
      current = parent;
    }

    dispatch(setGraphHighlightedPath(Array.from(pathSet)));
    const targetK = 1;
    dispatch(
      setGraphTransform({
        x: window.innerWidth / 2 - node.x * targetK,
        y: window.innerHeight / 2 - node.y * targetK,
        k: targetK,
      }),
    );
  };

  const toggleCollapse = (controllerId: string, shouldCollapse: boolean) => {
    const next = new Set(collapsedControllers);
    if (shouldCollapse) {
      next.add(controllerId);
    } else {
      next.delete(controllerId);
    }
    dispatch(setGraphCollapsedControllers(Array.from(next)));
    dispatch(setGraphActiveDropdown(null));
  };

  const handleNodeClick = (node: GraphNode) => {
    if (node.type === 'device_controller') {
      toggleCollapse(node.id, !collapsedControllersSet.has(node.id));
    }
    focusOnNode(node);
  };

  const isNodeDimmed = (node: GraphNode) => {
    if (searchQuery && highlightedPathSet.size === 0) {
      return true;
    }
    if (highlightedPathSet.size > 0) {
      return !highlightedPathSet.has(node.id);
    }
    return false;
  };

  const isEdgeDimmed = (edgeId: string) => {
    if (searchQuery && highlightedPathSet.size === 0) {
      return true;
    }
    if (highlightedPathSet.size > 0) {
      return !highlightedPathSet.has(edgeId);
    }
    return false;
  };

  const getChildrenNodes = (parentId: string) => {
    return nodes.filter((node) => node.parentId === parentId);
  };

  const openTerminal = useCallback(
    (target: string, deviceId: string, mode: DeviceTerminalMode = 'ssh') => {
      setTerminalTarget(target);
      setTerminalDeviceId(deviceId);
      setTerminalMode(mode);
    },
    [],
  );

  const closeTerminal = useCallback(() => {
    setTerminalTarget(null);
    setTerminalDeviceId(null);
    setTerminalMode(null);
  }, []);

  useEffect(() => {
    if (!sidebarNodeId) {
      closeTerminal();
    }
  }, [sidebarNodeId, closeTerminal]);

  const counts = useMemo(() => {
    const devices = nodes.filter((node) => node.type === 'device');
    return {
      available: devices.filter((node) => node.status === 'Available').length,
      busy: devices.filter((node) => node.status === 'Busy').length,
      faulty: devices.filter((node) => node.status === 'Faulty').length,
      unreachable: devices.filter((node) => node.status === 'Not Reachable')
        .length,
      total: devices.length,
    };
  }, [nodes]);

  const isAllCollapsed =
    allControllers.length > 0 &&
    collapsedControllers.length === allControllers.length;
  const isAllExpanded = collapsedControllers.length === 0;

  return (
    <div className={styles.mainWrapper}>
      <div className={styles.tabsSection}>
        <div className={styles.tabsContainer}>
          <div
            className={`${styles.tabIndicator} ${
              isTreeIndicatorActive ? styles.tabIndicatorRight : ''
            }`}
          />
          <button
            type="button"
            className={styles.tabButton}
            onClick={handleSwitchToDevices}
          >
            <img
              src={DevicePassiveIcon}
              alt="Devices icon"
              className={styles.tabIcon}
            />
            <span>Devices</span>
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${styles.tabActive}`}
          >
            <img
              src={TopologyActiveIcon}
              alt="Tree Topology icon"
              className={styles.tabIcon}
            />
            <span>Tree Topology</span>
          </button>
        </div>
      </div>

      <header className={styles.navbar}>
        <div className={styles.navbarMain}>
          <div className={styles.navbarLeft}>
            <div className={styles.dropdownContainer}>
              <button
                type="button"
                className={`${styles.unifiedDropdownBtn} ${
                  activeDropdown === 'combined' ? styles.active : ''
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  dispatch(
                    setGraphActiveDropdown(
                      activeDropdown === 'combined' ? null : 'combined',
                    ),
                  );
                }}
              >
                Expand/Collapse
              </button>
              {activeDropdown === 'combined' && (
                <div className={styles.dropdownMenu}>
                  <div
                    className={`${styles.dropdownItem} ${
                      isAllExpanded ? styles.disabled : ''
                    }`}
                    onClick={() => {
                      if (!isAllExpanded) {
                        dispatch(setGraphCollapsedControllers([]));
                        dispatch(setGraphActiveDropdown(null));
                      }
                    }}
                  >
                    Expand All
                  </div>
                  <div
                    className={`${styles.dropdownItem} ${
                      isAllCollapsed ? styles.disabled : ''
                    }`}
                    onClick={() => {
                      if (!isAllCollapsed) {
                        dispatch(
                          setGraphCollapsedControllers(
                            allControllers.map((controller) => controller.id),
                          ),
                        );
                        dispatch(setGraphActiveDropdown(null));
                      }
                    }}
                  >
                    Collapse All
                  </div>
                  <div className={styles.dropdownDivider} />
                  {allControllers.map((controller) => {
                    const isCollapsed = collapsedControllersSet.has(
                      controller.id,
                    );
                    return (
                      <div
                        key={`expand-${controller.id}`}
                        className={`${styles.dropdownItem} ${
                          !isCollapsed ? styles.disabled : ''
                        }`}
                        onClick={() =>
                          isCollapsed && toggleCollapse(controller.id, false)
                        }
                      >
                        Expand {controller.label}
                      </div>
                    );
                  })}
                  <div className={styles.dropdownDivider} />
                  {allControllers.map((controller) => {
                    const isCollapsed = collapsedControllersSet.has(
                      controller.id,
                    );
                    return (
                      <div
                        key={`collapse-${controller.id}`}
                        className={`${styles.dropdownItem} ${
                          isCollapsed ? styles.disabled : ''
                        }`}
                        onClick={() =>
                          !isCollapsed && toggleCollapse(controller.id, true)
                        }
                      >
                        Collapse {controller.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Search devices..."
              className={`${styles.searchInput} ${sidebarNodeId ? styles.searchInputCompact : ''}`}
              value={searchQuery}
              onChange={(event) =>
                dispatch(setGraphSearchQuery(event.target.value))
              }
            />
          </div>

          <div className={`${styles.navbarCenter} `}>
            <div className={styles.statusBar}>
              <span className={styles.statusLabel}>Device Status:</span>
              <div className={styles.statusItem}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#00C950',
                    marginRight: '4px',
                  }}
                />
                Available:{' '}
                <span
                  className={styles.statusCount}
                  style={{ color: '#00C950' }}
                >
                  {counts.available}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#FE9A00',
                    marginRight: '4px',
                  }}
                />
                Busy:{' '}
                <span
                  className={styles.statusCount}
                  style={{ color: '#FE9A00' }}
                >
                  {counts.busy}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#FB2C36',
                    marginRight: '4px',
                  }}
                />
                Faulty:{' '}
                <span
                  className={styles.statusCount}
                  style={{ color: '#FB2C36' }}
                >
                  {counts.faulty}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#6A7282',
                    marginRight: '4px',
                  }}
                />
                Not Reachable:{' '}
                <span
                  className={styles.statusCount}
                  style={{ color: '#6A7282' }}
                >
                  {counts.unreachable}
                </span>
              </div>
              <div className={styles.totalItem}>
                Total:{' '}
                <span className={styles.statusCount}>{counts.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${styles.navbarRight} ${sidebarNodeId ? styles.navbarRightShifted : ''}`}
        >
          <div className={styles.controlGroup}>
            <button
              type="button"
              className={styles.controlButton}
              onClick={zoomOut}
            >
              −
            </button>
            <div className={styles.zoomValue}>
              {Math.round(transform.k * 100)}%
            </div>
            <button
              type="button"
              className={styles.controlButton}
              onClick={zoomIn}
            >
              +
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={fitView}
            >
              ⤢
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={resetView}
            >
              ⌂
            </button>
          </div>
        </div>
      </header>

      <div
        className={`${styles.workspace} ${sidebarNodeId ? styles.workspaceWithSidebar : ''}`}
      >
        <div
          ref={canvasRef}
          className={`${styles.graphCanvas} ${isPanning ? styles.dragging : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(event) => {
            const zoomSensitivity = 0.001;
            const delta = -event.deltaY * zoomSensitivity;
            const newScale = Math.min(
              Math.max(transform.k + delta, MIN_K),
              MAX_K,
            );
            dispatch(updateGraphTransform({ k: newScale }));
          }}
        >
          <div
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
              transformOrigin: '0 0',
              position: 'absolute',
            }}
          >
            <svg style={{ position: 'absolute', overflow: 'visible' }}>
              {visibleEdges.map((edge) => (
                <Edge
                  key={edge.id}
                  sourceNode={visibleNodes.find(
                    (node) => node.id === edge.source,
                  )}
                  targetNode={visibleNodes.find(
                    (node) => node.id === edge.target,
                  )}
                  isDimmed={isEdgeDimmed(edge.id)}
                  isHighlighted={highlightedPathSet.has(edge.id)}
                />
              ))}
            </svg>
            {visibleNodes.map((node) => (
              <Node
                key={node.id}
                node={node}
                onClick={handleNodeClick}
                onMouseEnter={() => dispatch(setGraphHoveredNodeId(node.id))}
                onMouseLeave={() => dispatch(setGraphHoveredNodeId(null))}
                isDimmed={isNodeDimmed(node)}
                isHighlighted={
                  selectedNodeId === node.id || highlightedPathSet.has(node.id)
                }
              />
            ))}

            {hoveredNode && (
              <div
                className={styles.tooltipCard}
                style={{
                  left: hoveredNode.x,
                  top: hoveredNode.y + 60,
                }}
              >
                {/* Card Header with Icon */}
                <div className={styles.tooltipCardHeader}>
                  <div className={styles.tooltipCardIcon}>
                    {hoveredNode.type === 'farm_controller' && (
                      <FCIcon
                        style={{
                          width: '30px',
                          height: 'auto',
                          paddingLeft: '10px',
                        }}
                      />
                    )}
                    {hoveredNode.type === 'device_controller' && (
                      <DCIcon
                        style={{
                          width: '30px',
                          height: 'auto',
                          paddingLeft: '10px',
                        }}
                      />
                    )}
                    {hoveredNode.type === 'device' && (
                      <DeviceIcon
                        style={{
                          width: '30px',
                          height: 'auto',
                          paddingLeft: '10px',
                        }}
                      />
                    )}
                  </div>

                  <div className={styles.tooltipCardTitle}>
                    {hoveredNode.label || hoveredNode.id}
                  </div>
                </div>

                {/* Card Content */}
                <div className={styles.tooltipCardContent}>
                  <div className={styles.tooltipContentRow}>
                    <span className={styles.tooltipContentValue}>
                      {hoveredNode.type === 'farm_controller'
                        ? 'Farm Controller'
                        : hoveredNode.type === 'device_controller'
                          ? 'Device Controller'
                          : hoveredNode.type === 'device'
                            ? 'Device Node'
                            : hoveredNode.type}
                    </span>
                  </div>
                </div>

                {/* Card Footer with Status and Info Cards */}
                <div className={styles.tooltipCardFooter}>
                  {/* Status Card */}
                  <div className={styles.infoCard}>
                    <div
                      className={styles.infoCardIcon}
                      style={{
                        background:
                          hoveredNode.status === 'Available'
                            ? '#E0FFEB'
                            : hoveredNode.status === 'Busy'
                              ? '#FFF4E0'
                              : hoveredNode.status === 'Faulty'
                                ? '#FFE0E0'
                                : hoveredNode.status === 'Not Reachable'
                                  ? '#F0F0F0'
                                  : '#E0FFEB',
                        color:
                          hoveredNode.status === 'Available'
                            ? '#00C950'
                            : hoveredNode.status === 'Busy'
                              ? '#FE9A00'
                              : hoveredNode.status === 'Faulty'
                                ? '#FB2C36'
                                : hoveredNode.status === 'Not Reachable'
                                  ? '#6A7282'
                                  : '#00C950',
                      }}
                    >
                      {hoveredNode.status === 'Available' && (
                        <img
                          src={TreeAvailableIcon}
                          alt="Tree Available Icon"
                        />
                      )}
                      {hoveredNode.status === 'Busy' && (
                        <img src={TreeBusyIcon} alt="Tree Busy Icon" />
                      )}
                      {hoveredNode.status === 'Faulty' && (
                        <img src={TreeFaultyIcon} alt="Tree Faulty Icon" />
                      )}
                      {hoveredNode.status === 'Not Reachable' && (
                        <img
                          src={TreeNotAvailableIcon}
                          alt="Tree Not Available Icon"
                        />
                      )}
                    </div>
                    <div className={styles.infoCardContent}>
                      <div className={styles.infoCardLabel}>Status</div>
                      <div
                        className={styles.infoCardValue}
                        style={{
                          color:
                            hoveredNode.status === 'Available'
                              ? '#00C950'
                              : hoveredNode.status === 'Busy'
                                ? '#EFB100'
                                : hoveredNode.status === 'Faulty'
                                  ? '#FB2C36'
                                  : hoveredNode.status === 'Not Reachable'
                                    ? '#6A7282'
                                    : '#111827',
                        }}
                      >
                        {hoveredNode.status || 'Available'}
                      </div>
                    </div>
                  </div>

                  {/* Device ID Card */}
                  <div className={styles.infoCard}>
                    <div
                      className={styles.infoCardIcon}
                      style={{ background: '#F0F0F0', color: '#64748B' }}
                    >
                      <img
                        src={TreeIdIcon}
                        alt="Device Id "
                        style={{ width: '36px', height: '36px' }}
                      />
                    </div>
                    <div className={styles.infoCardContent}>
                      <div className={styles.infoCardLabel}>Device ID</div>
                      <div
                        className={styles.infoCardValue}
                        style={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
                          fontSize: '12px',
                          color: '#0f172a',
                        }}
                      >
                        {hoveredNode.deviceId || hoveredNode.id || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* IP Address Card */}
                  <div className={styles.infoCard}>
                    <div
                      className={styles.infoCardIcon}
                      style={{ background: '#F0F0F0', color: '#64748B' }}
                    >
                      <img
                        src={TreeNetIcon}
                        alt="Ip Address"
                        style={{ width: '36px', height: '36px' }}
                      />
                    </div>
                    <div className={styles.infoCardContent}>
                      <div className={styles.infoCardLabel}>IP Address</div>
                      <div className={styles.infoCardValue}>
                        {hoveredNode.ip || '192.168.0.0'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Description */}
                <div className={styles.tooltipCardDescription}>
                  {hoveredNode.type === 'farm_controller' &&
                    'Manages controllers'}
                  {hoveredNode.type === 'device_controller' && 'Manages nodes'}
                  {hoveredNode.type === 'device' && 'Click to view details'}
                </div>
              </div>
            )}
          </div>
        </div>

        <NodeSidebar
          node={sidebarNode}
          childrenNodes={sidebarNode ? getChildrenNodes(sidebarNode.id) : []}
          selectedDevice={sidebarDevice}
          heartbeatSeconds={sidebarHeartbeatSeconds}
          hasHeartbeat={sidebarHasHeartbeat}
          onOpenTerminal={openTerminal}
          onClose={() => {
            dispatch(setGraphSidebarNodeId(null));
            dispatch(clearSidebarDevice());
          }}
        />
      </div>

      {terminalDeviceId && terminalMode && (
        <SSHTerminalBar
          target={terminalTarget ?? undefined}
          deviceId={terminalDeviceId}
          onClose={closeTerminal}
          title={
            terminalMode === 'rtos'
              ? `RTOS session for ${terminalDeviceId}`
              : `Connected to ${terminalDeviceId}`
          }
          initialHeight={terminalMode === 'rtos' ? 420 : 300}
        >
          {terminalMode === 'rtos' ? (
            <RTOSTerminalComponent deviceId={terminalDeviceId} />
          ) : (
            terminalTarget && <SSHTerminalComponent target={terminalTarget} />
          )}
        </SSHTerminalBar>
      )}
    </div>
  );
};

export default CustomGraph;
