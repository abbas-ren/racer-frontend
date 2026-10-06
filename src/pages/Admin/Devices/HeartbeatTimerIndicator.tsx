import React, { useMemo } from 'react';
import { CircularProgress } from 'components/common/Progressbar/CircularProgressbar';
import { DeviceState } from 'typesCustom/components';
import { HeartbeatTimeouts } from './DeviceStatusIndicator';

const MAX_TIMER = 999;

interface HeartbeatTimerIndicatorProps {
  seconds: number;
  hasHeartbeat: boolean;
  heartbeatTimeout: number;
  state: DeviceState;
  size?: number;
  strokeWidth?: number;
}

const HeartbeatTimerIndicator: React.FC<HeartbeatTimerIndicatorProps> = ({
  seconds,
  hasHeartbeat: _hasHeartbeat,
  heartbeatTimeout,
  state,
  size = 42,
  strokeWidth = 6,
}) => {
  const safeHeartbeatTimeout = Math.max(heartbeatTimeout || 1, 1);
  const clampedSeconds = Math.min(seconds, MAX_TIMER);

  const timerProps = useMemo(() => {
    const stage1End = safeHeartbeatTimeout;
    const stage2End = safeHeartbeatTimeout * HeartbeatTimeouts.NOT_REACHABLE;
    const stage3End = safeHeartbeatTimeout * HeartbeatTimeouts.FAULTY;

    // ✅ Stage 1: Healthy (ONLY heartbeatTimeout)
    if (clampedSeconds <= stage1End) {
      const percentage = (clampedSeconds / stage1End) * 100;

      return {
        percentage,
        color: state === DeviceState.BUSY ? '#FFB222' : '#1DBD53',
        text: `${clampedSeconds}`,
      };
    }

    // ✅ Stage 2: Not Reachable
    if (clampedSeconds <= stage2End) {
      const percentage =
        ((clampedSeconds - stage1End) / (stage2End - stage1End)) * 100;

      return {
        percentage,
        color: '#8E8E8E',
        text: `${clampedSeconds}`,
      };
    }

    // ✅ Stage 3: Faulty threshold range
    if (clampedSeconds <= stage3End) {
      const percentage =
        ((clampedSeconds - stage2End) / (stage3End - stage2End)) * 100;

      return {
        percentage,
        color: '#FF3B30',
        text: `${clampedSeconds}`,
      };
    }

    // ✅ Final stretch (after faulty → till 999)
    const percentage =
      ((clampedSeconds - stage3End) / (MAX_TIMER - stage3End)) * 100;

    return {
      percentage: Math.min(Math.max(percentage, 0), 100),
      color: '#FF3B30',
      text: `${clampedSeconds}`,
    };
  }, [clampedSeconds, safeHeartbeatTimeout, state]);

  return (
    <CircularProgress
      percentage={timerProps.percentage}
      size={size}
      color={timerProps.color}
      strokeWidth={strokeWidth}
      text={timerProps.text}
    />
  );
};

export default HeartbeatTimerIndicator;
