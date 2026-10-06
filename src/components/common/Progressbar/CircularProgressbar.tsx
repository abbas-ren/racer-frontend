// CircularProgress.tsx
import React from 'react';
import styles from './CircularProgress.module.scss';

interface CircularProgressProps {
  /** The percentage value (0-100) */
  percentage: number;
  percentageText?: number;
  /** Size of the circle in pixels */
  size?: number;
  /** Color of the progress stroke */
  color?: string;
  /** Background color of the track */
  trackColor?: string;
  /** Width of the progress stroke */
  strokeWidth?: number;
  /** Show percentage text in center */
  showPercentage?: boolean;
  /** Custom text to display instead of percentage */
  text?: string;
  /** Font size of the text */
  fontSize?: number;
  /** Text color */
  textColor?: string;
  /** Animation duration in seconds */
  animationDuration?: number;
  /** Custom className for styling */
  className?: string;
  /** Clockwise or counter-clockwise direction */
  clockwise?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  color = '#ff4444',
  trackColor = '#f0f0f0',
  strokeWidth = 8,
  showPercentage = true,
  text,
  fontSize,
  textColor = '#333',
  animationDuration = 1,
  className = '',
  clockwise = true,
}) => {
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Auto-calculate font size based on circle size if not provided
  const calculatedFontSize = fontSize || Math.max(12, size * 0.16);

  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`${styles.container} ${className}`}>
      <div
        className={styles.circleWrapper}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className={styles.svg}>
          {/* Background circle (track) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={
              clockwise
                ? styles.progressClockwise
                : styles.progressCounterClockwise
            }
            style={{
              transition: `stroke-dashoffset ${animationDuration}s ease-in-out`,
            }}
          />
        </svg>

        {/* Text overlay */}
        {(showPercentage || text) && (
          <div
            className={styles.textOverlay}
            style={{
              fontSize: calculatedFontSize,
              color: textColor,
            }}
          >
            {text || `${Math.round(clampedPercentage)}`}
          </div>
        )}
      </div>
    </div>
  );
};
