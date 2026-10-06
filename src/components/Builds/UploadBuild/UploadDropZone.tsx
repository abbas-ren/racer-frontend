import { Box, Stack, Typography } from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './UploadBuild.module.scss';

interface UploadDropZoneProps {
  fileCount: number;
  totalSize: number;
  iconColor: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPickFiles: (evt: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * UploadDropZone - The file drop/click area with file count summary.
 */
function UploadDropZone({
  fileCount,
  totalSize,
  iconColor,
  inputRef,
  onPickFiles,
}: UploadDropZoneProps) {
  return (
    <Box>
      <Typography className={styles.label} variant="body3">
        Build File
      </Typography>

      <Stack
        className={styles.dropZone}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          multiple
          className={styles.fileInput}
          onChange={onPickFiles}
          onClick={(e) => e.stopPropagation()}
        />
        <Stack direction="column" alignItems="center" gap={1.5}>
          <Box className={styles.iconWrapWhite}>
            <CustomIcon name="upload" size={24} color={iconColor} />
          </Box>
          {fileCount === 0 && (
            <Stack direction="column" alignItems="center" gap={0.5}>
              <Typography variant="body3" className={styles.dropZoneText}>
                Click to upload or drag and drop
              </Typography>
              <Typography variant="body4" className={styles.dropZoneSubtext}>
                ZIP files (up to 500 MB)
              </Typography>
            </Stack>
          )}
          {fileCount > 0 && (
            <Stack>
              <Typography variant="body2" className={styles.filesCount}>
                {fileCount} {fileCount === 1 ? 'file' : 'files'}
              </Typography>
              <Typography variant="body4" className={styles.filesSize}>
                {totalSize.toFixed(4)} MB
              </Typography>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

export default UploadDropZone;
