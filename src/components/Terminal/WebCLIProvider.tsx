import { createContext, useContext, useState } from 'react';
import WebCLIModal from './WebCLI';
import FloatingTerminalButton from 'components/common/FloatingTerminalButton';

const WebCLIContext = createContext<any>(null);

export const useWebCLI = () => useContext(WebCLIContext);

export function WebCLIProvider({ children }: any) {
  const [open, setOpen] = useState(false);

  const openCLI = () => {
    if (!open) setOpen(true); // prevent unnecessary state update
  };

  return (
    <WebCLIContext.Provider
      value={{
        openCLI,
        closeCLI: () => setOpen(false),
      }}
    >
      {children}
      <FloatingTerminalButton onClick={openCLI} disabled={open} />{' '}
      {/* Optional: separate floating button component */}
      {/* 🧠 Persistent modal */}
      <WebCLIModal open={open} onClose={() => setOpen(false)} />
    </WebCLIContext.Provider>
  );
}
