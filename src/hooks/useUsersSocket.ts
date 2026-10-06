import { UserData } from '../services/wsClient';
import { useSocketIoEvent } from './useSocketIoEvent';

export const useUsersSocket = (onUser: (user: UserData) => void) => {
  useSocketIoEvent<UserData>('user', onUser);
};
