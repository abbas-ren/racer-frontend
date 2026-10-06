import { GraphNode } from 'typesCustom/treeTopology';

interface EdgeProps {
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
  isDimmed: boolean;
  isHighlighted: boolean;
}

const Edge = ({
  sourceNode,
  targetNode,
  isDimmed,
  isHighlighted,
}: EdgeProps) => {
  if (!sourceNode || !targetNode) {
    return null;
  }

  const sx = sourceNode.x;
  const sy = sourceNode.y;
  const tx = targetNode.x;
  const ty = targetNode.y;

  const path = `M ${sx} ${sy} C ${sx} ${(sy + ty) / 2}, ${tx} ${(sy + ty) / 2}, ${tx} ${ty}`;

  const getStroke = () => {
    if (isHighlighted) return '#14b8a6';
    return '#cbd5e1';
  };

  const getWidth = () => {
    if (isHighlighted) return 3;
    return 1.5;
  };

  const getOpacity = () => {
    if (isDimmed) return 0.2;
    return 1;
  };

  return (
    <path
      d={path}
      fill="none"
      stroke={getStroke()}
      strokeWidth={getWidth()}
      strokeLinecap="round"
      style={{
        transition: 'all 0.3s ease',
        opacity: getOpacity(),
      }}
    />
  );
};

export default Edge;
