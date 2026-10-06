import { useSelector } from 'react-redux';
import { RootState } from 'store/store';

export const useHeartbeatManager = () => {
  const { heartbeats, heartbeatTimers, deviceHeartbeatStatus } = useSelector(
    (state: RootState) => state.heartbeat,
  );
  return {
    heartbeats,
    heartbeatTimers,
    deviceHeartbeatStatus,
  };
};
