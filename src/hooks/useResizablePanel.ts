import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseResizablePanelReturn {
  leftWidth: number; // percentage
  rightWidth: number; // percentage
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

function useResizablePanel(
  minLeftPercent: number = 60,
  maxLeftPercent: number = 75,
  minRightPercent: number = 25,
  maxRightPercent: number = 40,
  defaultLeftPercent: number = 75,
): UseResizablePanelReturn {
  const [leftWidth, setLeftWidth] = useState<number>(defaultLeftPercent);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const rawLeftWidthPx = e.clientX - containerRect.left;
      const rawLeftPercent = (rawLeftWidthPx / containerRect.width) * 100;

      // Normalize constraints
      const minLeft = Math.max(0, Math.min(100, minLeftPercent));
      const maxLeft = Math.max(minLeft, Math.min(100, maxLeftPercent));
      const minRight = Math.max(0, Math.min(100, minRightPercent));
      const maxRight = Math.max(minRight, Math.min(100, maxRightPercent));

      // Enforce right panel constraints by adjusting left bounds
      const leftLowerBound = Math.max(minLeft, 100 - maxRight); // right <= maxRight
      const leftUpperBound = Math.min(maxLeft, 100 - minRight); // right >= minRight

      const clampedLeftPercent = Math.min(
        leftUpperBound,
        Math.max(leftLowerBound, rawLeftPercent),
      );

      setLeftWidth(clampedLeftPercent);
    },
    [
      isDragging,
      minLeftPercent,
      maxLeftPercent,
      minRightPercent,
      maxRightPercent,
    ],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    // Store container reference
    const target = e.currentTarget as HTMLElement;
    const container = target.closest(
      '[data-resizable-container]',
    ) as HTMLDivElement;
    if (container) {
      containerRef.current = container;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate right width percentage
  const rightWidth = Math.max(0, Math.min(100, 100 - leftWidth));

  return {
    leftWidth,
    rightWidth,
    isDragging,
    handleMouseDown,
  };
}

export default useResizablePanel;
