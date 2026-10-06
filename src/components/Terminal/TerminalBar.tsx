import { motion, AnimatePresence } from 'framer-motion';
import { FC, useState, useRef, MouseEvent as ReactMouseEvent } from 'react';
import styles from './TerminalBar.module.scss';

interface TerminalBarProps {
  target: string;
  deviceId: string;
  onClose: () => void;
  children: React.ReactNode;
}

const TerminalBar: FC<TerminalBarProps> = ({ deviceId, onClose, children }) => {
  const [size, setSize] = useState<{ width: string | number; height: number }>({
    width: '100%',
    height: 300,
  });
  const [position, _setPosition] = useState({ x: 0, y: 0 });
  const isResizing = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });
  // const startPosition = useRef({ x: 0, y: 0 });

  const onResizeMouseDown = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    isResizing.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };

    // startPosition.current = { ...position };

    const currentWidth =
      typeof size.width === 'string'
        ? (document.querySelector(`.${styles.terminalWrapper}`) as HTMLElement)
            ?.offsetWidth || 0
        : size.width;

    startSize.current = { width: currentWidth, height: size.height };

    document.addEventListener('mousemove', onResizing);
    document.addEventListener('mouseup', stopResizing);
  };

  const onResizing = (e: MouseEvent) => {
    if (!isResizing.current) return;

    const deltaX = e.clientX - startMouse.current.x;
    const deltaY = e.clientY - startMouse.current.y;

    const newWidth = Math.max(300, startSize.current.width + deltaX);
    const newHeight = Math.max(150, startSize.current.height + deltaY);

    setSize({
      width: newWidth,
      height: newHeight,
    });
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', onResizing);
    document.removeEventListener('mouseup', stopResizing);
  };

  return (
    <AnimatePresence>
      <motion.div
        style={{
          width: size.width,
          height: size.height,
        }}
        initial={{ y: '100%' }}
        animate={{ x: position.x, y: position.y }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        drag={!isResizing.current}
        dragMomentum={false}
        dragConstraints={{
          left: -(window.innerWidth - 300),
          right: window.innerWidth - 300,
          top: -(window.innerHeight - 150),
          bottom: 0,
        }}
        // onDragEnd={(_, info) => {
        //   setPosition((prev) => ({
        //     x: prev.x + info.offset.x,
        //     y: prev.y + info.offset.y,
        //   }));
        // }}
        className={styles.terminalWrapper}
      >
        <div className={styles.terminalHeader}>
          <h4>Connected to {deviceId}</h4>
          <button onClick={onClose} title="Close Terminal">
            ✕
          </button>
        </div>
        <div className={styles.terminalContent}>{children}</div>

        <div className={styles.resizeHandle} onMouseDown={onResizeMouseDown} />
      </motion.div>
    </AnimatePresence>
  );
};

export default TerminalBar;
