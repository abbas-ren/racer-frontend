import { useEffect, useRef } from 'react';
import { getSharedSocket } from 'services/socketIoClient';

interface UseSocketIoEventOptions {
  userId?: string;
  enabled?: boolean;
}

export const useSocketIoEvent = <T>(
  eventName: string,
  handler: (payload: T) => void,
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
    const wrappedHandler = (payload: T) => {
      handlerRef.current(payload);
    };

    socket.on(eventName, wrappedHandler);

    return () => {
      socket.off(eventName, wrappedHandler);
    };
  }, [enabled, eventName, userId]);
};
