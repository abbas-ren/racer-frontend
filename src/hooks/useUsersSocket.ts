import { useSocketIoEvent } from './useSocketIoEvent';
import type { UserDataPayload } from 'typesCustom/websocket';
export const useUsersSocket = (onUser: (user: UserDataPayload) => void) => {
  useSocketIoEvent<UserDataPayload>('userData', onUser);
};
