import { Alert } from '@mui/material';
import React, { useState, type ReactNode, useEffect } from 'react';
import styles from './LoadingStyle.module.scss';
import LoadingContext from './LoadingContext';

const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [error, success]);

  return (
    <LoadingContext.Provider
      value={{ loading, setLoading, setSuccess, setError, success, error }}
    >
      {/* {loading && (
        <div className={styles["overlay"]}>
          <div className={styles["spinner"]}></div>
        </div>
      )} */}
      <div className={styles['alert-parent']}>
        {children}
        <div className={styles['alerts']}>
          {error && (
            <Alert variant="filled" severity="error">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="filled" severity="success">
              {success}
            </Alert>
          )}
        </div>
      </div>
    </LoadingContext.Provider>
  );
};

export default LoadingProvider;
