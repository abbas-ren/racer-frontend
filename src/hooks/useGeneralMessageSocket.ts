import { GeneralWebsocketPayload } from 'types/websocket';
import { useSocketIoEvent } from './useSocketIoEvent';


export const useGeneralMessageSocket = (onMessage: (message: GeneralWebsocketPayload) => void) => {
  useSocketIoEvent<GeneralWebsocketPayload>('general', onMessage);
};

