import { useState } from 'react';
import TableFilter from 'components/common/TableFilter';
import FilterComponent from './FilterComponent';
import { Stack } from '@mui/material';
import Button from '@mui/material/Button';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './BuildHeader.module.scss';
import UploadProgress from 'components/common/UploadProgress/UploadProgress';
import clsx from 'clsx';

interface BuildHeaderProps {
  count?: number;
  onFilterChange?: (filterValue: string) => void;
  onSearchChange?: (searchValue: string) => void;
  onUploadClick?: () => void;
  uploadProgress?: {
    progress: number;
    filesTotal?: number;
    filesInProgress?: number;
    message?: string;
    status?: 'uploading' | 'completed' | 'error';
  } | null;
}

const BuildHeader = ({
  count,
  onFilterChange,
  onSearchChange,
  onUploadClick,
  uploadProgress,
}: BuildHeaderProps) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const handleFilterChange = (filterValue: string) => {
    setFilter(filterValue);
    onFilterChange?.(filterValue);
  };

  const handleSearchChange = (searchValue: string) => {
    setSearch(searchValue);
    onSearchChange?.(searchValue);
  };

  return (
    <Stack
      className={styles.container}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={2}
    >
      <TableFilter
        filterValue={filter}
        onFilterChange={handleFilterChange}
        searchValue={search}
        onSearchChange={handleSearchChange}
        count={count ?? 0}
        countLabel="builds"
        customFilterComponent={<FilterComponent />}
        searchPlaceholder="Search by build version, device or family..."
        searchWidth="400px"
      />

      <Stack direction="row" alignItems="center" gap={2}>
        {uploadProgress && (
          <UploadProgress
            progress={uploadProgress.progress}
            filesTotal={uploadProgress.filesTotal}
            filesInProgress={uploadProgress.filesInProgress}
            message={uploadProgress.message}
            size={60}
            color={
              uploadProgress.status === 'completed'
                ? 'var(--mui-palette-success-main)'
                : uploadProgress.status === 'error'
                  ? 'var(--mui-palette-error-main)'
                  : 'var(--mui-palette-primary-main)'
            }
          />
        )}
        <Button
          startIcon={<CustomIcon name="upload" size={16} color="#ffffff" />}
          className={clsx(styles.uploadButton, {
            [styles.buttonDisabled]: uploadProgress?.status === 'uploading',
          })}
          onClick={onUploadClick}
          disabled={uploadProgress?.status === 'uploading'}
        >
          Upload New Build
        </Button>
      </Stack>
    </Stack>
  );
};

export default BuildHeader;
