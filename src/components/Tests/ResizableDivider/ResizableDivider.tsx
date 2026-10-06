import { Box } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import styles from './ResizableDivider.module.scss';

interface ResizableDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

function ResizableDivider({ onMouseDown, isDragging }: ResizableDividerProps) {
  return (
    <Box
      className={`${styles.divider} ${isDragging ? styles.dragging : ''}`}
      onMouseDown={onMouseDown}
    >
      <Box className={styles.grip}>
        <DragIndicatorIcon className={styles.gripIcon} />
      </Box>
    </Box>
  );
}

export default ResizableDivider;
