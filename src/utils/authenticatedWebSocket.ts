import store from 'store';

const BROWSER_SUBPROTOCOL = 'farm-browser-v1';

export const createAuthenticatedWebSocket = (url: string) => {
  const token = store.getState().auth.token;
  const protocols = token
    ? [BROWSER_SUBPROTOCOL, `bearer.${token}`]
    : [BROWSER_SUBPROTOCOL];
  return new WebSocket(url, protocols);
};
