import { useEffect, useRef } from 'react';
// import { useDispatch } from 'react-redux';
import { getSharedSocket } from 'services/socketIoClient';
interface UseSocketIoEventOptions {
  userId?: string;
  enabled?: boolean;
}

export const useSocketIoEvent = <GeneralWebsocketPayload>(
  eventName: string,
  handler: (payload: GeneralWebsocketPayload) => void,
  options: UseSocketIoEventOptions = {},
) => {
  const { userId, enabled = true } = options;
  const handlerRef = useRef(handler);

    // const dispatch = useDispatch();

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = getSharedSocket(userId);
    const wrappedHandler = (payload: GeneralWebsocketPayload) => {
    switch (payload) {
      // case 'deviceStateUpdate':
      //   dispatch(deviceStateUpdate(payload));
      //   break;

      // case 'devicePowerUpdate':
      //   dispatch(devicePowerUpdate(payload));
      //   break;
      // case 'rtosLog':
      //   dispatch(rtosLog(payload));
      //   break;
      // case 'testExecution':
      //   dispatch(testExecutionUpdate(payload));
      //   break;

      // case 'buildTestExecutionUpdate':
      //   dispatch(buildTestExecutionUpdate(payload));
      //   break;

      // case 'uploadProgress':
      //   dispatch(uploadProgress(payload));
      //   break;

      // case 'relayConfigurationStatus':
      //   dispatch(relayConfigurationStatus(payload));
      //   break;
      // case 'buildPerformanceUpdate':
      //   dispatch(buildPerformanceUpdate(payload));
      //   break;
      // case 'buildStatusChanged':
      //   dispatch(buildStatusChanged(payload));
      //   break;
      // case 'buildUploaded':
      //   dispatch(buildUploaded(payload));
      //   break;
      // case 'uploadError':
      //   dispatch(uploadError(payload));
      //   break;

      // case 'uploadComplete':
      //   dispatch(uploadComplete(payload));
      //   break;
      // case 'ssh':
      //   dispatch(sshOutputMessage(payload));
      //   break;
      // case 'rtosLog':
      //   dispatch(rtosLog(payload));
      //   break;
      // case 'buildPerformanceUpdate':
      //   dispatch(buildPerformanceUpdate(payload));
      //   break;
      // case 'buildStatusChanged':
      //   dispatch(buildStatusChanged(payload));
      //   break;
      // case 'buildUploaded':
      //   dispatch(buildUploaded(payload));
      //   break;
      // case 'uploadError':
      //   dispatch(uploadError(payload));
      //   break;

      // case 'uploadComplete':
      //   dispatch(uploadComplete(payload));
      //   break;


      default:
        handlerRef.current(payload);
        // Makes future additions visible during development.
        console.warn('Unhandled general event', payload);
    }
  };
    
    socket.on(eventName, wrappedHandler);

    return () => {
      socket.off(eventName, wrappedHandler);
    };
  }, [enabled, eventName, userId]);
};


