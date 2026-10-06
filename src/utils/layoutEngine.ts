import { GraphNode } from 'typesCustom/treeTopology';

export const calculateHierarchicalLayout = (
  nodes: GraphNode[],
): GraphNode[] => {
  if (!nodes.length) return [];

  const positionedNodes = nodes.map((node) => ({ ...node }));
  const farm = positionedNodes.find((node) => node.type === 'farm_controller');
  const controllers = positionedNodes.filter(
    (node) => node.type === 'device_controller',
  );

  const devicesByParent: Record<string, GraphNode[]> = {};
  positionedNodes.forEach((node) => {
    if (node.type === 'device' && node.parentId) {
      if (!devicesByParent[node.parentId]) {
        devicesByParent[node.parentId] = [];
      }
      devicesByParent[node.parentId].push(node);
    }
  });

  const MIN_DEVICE_GAP = 140;
  const MIN_CONTROLLER_WIDTH = 350;
  const CONTROLLER_PADDING = 150;

  let totalWidth = 0;
  const controllerMetrics = controllers.map((ctrl) => {
    const devices = devicesByParent[ctrl.id] || [];
    const deviceCount = devices.length;

    const requiredWidth =
      Math.max(MIN_CONTROLLER_WIDTH, deviceCount * MIN_DEVICE_GAP) +
      CONTROLLER_PADDING;

    const metric = {
      ctrl,
      devices,
      deviceCount,
      requiredWidth,
      startX: totalWidth,
    };

    totalWidth += requiredWidth;
    return metric;
  });

  if (farm) {
    farm.x = 0;
    farm.y = 0;
  }

  const startOffset = -totalWidth / 2;

  controllerMetrics.forEach((metric) => {
    const { ctrl, devices, requiredWidth, startX } = metric;

    ctrl.x = startOffset + startX + requiredWidth / 2;
    ctrl.y = 300;

    if (devices.length > 0) {
      const devicesWidth = devices.length * MIN_DEVICE_GAP;
      const deviceStartX = ctrl.x - devicesWidth / 2;

      devices.forEach((dev, index) => {
        dev.x = deviceStartX + MIN_DEVICE_GAP * (index + 0.5);
        dev.y = ctrl.y + 300;
      });
    }
  });

  return positionedNodes;
};

export const layoutFromApiResponse = (nodes: GraphNode[]): GraphNode[] =>
  calculateHierarchicalLayout(nodes);
