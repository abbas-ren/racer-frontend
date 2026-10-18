import { useSocketIoEvent } from './useSocketIoEvent';
import type { AlertDataPayload } from 'typesCustom/websocket';

export const useAlertSocket = (onAlert: (alert: AlertDataPayload) => void) => {
  useSocketIoEvent<AlertDataPayload>('alert', onAlert);
};
