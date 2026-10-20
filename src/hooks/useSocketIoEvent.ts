import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = getSharedSocket(userId);
    const wrappedHandler = (payload: GeneralWebsocketPayload) => {
      console.log('General websocket event received:', eventName);
      handlerRef.current(payload);
        // Makes future additions visible during development.
      console.warn('Unhandled general event', payload);
  };
    
    socket.on(eventName, wrappedHandler);

    return () => {
      socket.off(eventName, wrappedHandler);
    };
  }, [enabled, eventName, userId]);
};


