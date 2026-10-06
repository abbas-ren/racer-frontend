import { GraphNode } from 'typesCustom/treeTopology';
import { FCIcon } from 'assets/index';
import { DCIcon } from 'assets/index';
import styles from './Graph.module.scss';

interface NodeProps {
  node: GraphNode;
  onClick: (node: GraphNode) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isDimmed: boolean;
  isHighlighted: boolean;
}

const Node = ({
  node,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isDimmed,
  isHighlighted,
}: NodeProps) => {
  const isDevice = node.type === 'device';
  const isController = node.type === 'device_controller';
  const isFarm = node.type === 'farm_controller';

  const size = isDevice ? 48 : isFarm ? 64 : 58;

  const getBorder = () => {
    if (isHighlighted) return '5px solid #14b8a6';
    if (isFarm) return '2px solid rgba(59, 130, 246, 0.20)';
    if (isController) return '2px solid rgba(147, 51, 234, 0.20)';
    return '2px solid white';
  };

  const getBackground = () => {
    if (isFarm || isController) {
      return 'linear-gradient(135deg, #FFF 0%, #F8FAFC 50%, #F1F5F9 100%)';
    }

    switch (node.status) {
      case 'Available':
        return '#00C950';
      case 'Busy':
        return '#FE9A00';
      case 'Faulty':
        return '#FB2C36';
      case 'Not Reachable':
        return '#6A7282';
      default:
        return '#00C950';
    }
  };

  const getBoxShadow = () => {
    if (isHighlighted) return '0 0 25px rgba(20, 184, 166, 0.9)';
    if (isFarm) return '0 6px 20px 0 rgba(59, 130, 246, 0.30)';
    if (isController) return '0 6px 20px 0 rgba(139, 92, 246, 0.35)';
    return '0 2px 5px rgba(0,0,0,0.1)';
  };

  const getPulseColor = () => {
    switch (node.status) {
      case 'Available':
        return 'rgba(0, 201, 80, 0.45)';
      case 'Busy':
        return 'rgba(254, 154, 0, 0.45)';
      case 'Faulty':
        return 'rgba(251, 44, 54, 0.45)';
      case 'Not Reachable':
        return 'rgba(106, 114, 130, 0.45)';
      default:
        return 'rgba(0, 201, 80, 0.45)';
    }
  };

  const getIcon = () => {
    const iconStyle = {
      width: '60%',
      height: '60%',
      pointerEvents: 'none' as const,
    };
    if (isFarm) return <FCIcon style={iconStyle} />;
    if (isController) return <DCIcon style={iconStyle} />;
    return null;
  };

  return (
    <div
      onClick={(event) => {
        event.stopPropagation();
        onClick(node);
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        left: node.x - size / 2,
        top: node.y - size / 2,
        width: size,
        height: size,
        background: getBackground(),
        borderRadius: isDevice ? '50%' : isFarm ? '32px' : '29px',
        position: 'absolute',
        border: getBorder(),
        boxShadow: getBoxShadow(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: isDimmed ? 0.2 : 1,
        transform: isHighlighted ? 'scale(1.2)' : 'scale(1)',
        zIndex: isHighlighted ? 20 : 10,
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overflow: 'visible',
      }}
    >
      {isDevice && !isDimmed && (
        <span
          className={styles.deviceNodePulse}
          style={{ borderColor: getPulseColor() }}
        />
      )}
      {getIcon()}
      <div
        style={{
          position: 'absolute',
          left: isDevice ? '50%' : '100%',
          top: isDevice ? '100%' : '50%',
          transform: isDevice ? 'translateX(-50%)' : 'translateY(-50%)',
          marginLeft: isDevice ? '0' : '16px',
          marginTop: isDevice ? '14px' : '0',
          fontSize: isDevice ? '18px' : '14px',
          lineHeight: '1.2',
          fontWeight: '900',
          color: isHighlighted ? '#0f766e' : isDevice ? '#0f172a' : '#475569',
          textAlign: isDevice ? 'center' : 'left',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          textShadow:
            '0 0 6px white, 0 0 4px white, 0 0 2px white, 0 1px 3px rgba(0,0,0,0.3)',
        }}
      >
        {node.label}
      </div>
    </div>
  );
};

export default Node;
