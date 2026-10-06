import { useEffect, useMemo, useState } from 'react';
import { IDevice } from 'typesCustom/types';
import { formatDate } from 'utils/common';

export const useDeviceSearch = (data: IDevice[] | undefined) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredData = useMemo(() => {
    if (!data || !debouncedSearchTerm) return data;
    return data.filter((device) => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      return (
        device.deviceName?.toLowerCase().includes(searchLower) ||
        device.deviceId?.toLowerCase().includes(searchLower) ||
        device.deviceType?.toLowerCase().includes(searchLower) ||
        formatDate(new Date(device.createdAt)).includes(searchLower)
      );
    });
  }, [data, debouncedSearchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
  };
};
