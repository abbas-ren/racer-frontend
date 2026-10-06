import { memo } from 'react';
import CustomGraph from './TreeTopology/graph/CustomGraph';

interface TreeTopologyProps {
  onSwitchToDevices?: () => void;
}

const TreeTopology = ({ onSwitchToDevices }: TreeTopologyProps) => {
  return <CustomGraph onSwitchToDevices={onSwitchToDevices} />;
};

export default memo(TreeTopology);
