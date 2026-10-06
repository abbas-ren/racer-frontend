import { AlertData } from '../services/wsClient';
import { useSocketIoEvent } from './useSocketIoEvent';

export const useAlertSocket = (onAlert: (alert: AlertData) => void) => {
  useSocketIoEvent<AlertData>('alert', onAlert);
};
