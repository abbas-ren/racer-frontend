import { createContext } from 'react';

interface LoadingContextType {
  loading: boolean;
  success: string | null;
  error: string | null;
  setLoading: (value: boolean) => void;
  setSuccess: (value: string) => void;
  setError: (value: string | null) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export default LoadingContext;
