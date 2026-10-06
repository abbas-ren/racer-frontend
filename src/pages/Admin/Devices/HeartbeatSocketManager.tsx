/**
 * HeartbeatSocketManager is no longer needed.
 * Timer management is now local to the opened sidebar device
 * via useDeviceInterfaceSocket hook.
 * Kept as a no-op to avoid breaking any existing mounts.
 */
const HeartbeatSocketManager = () => null;

export default HeartbeatSocketManager;
