import {
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import { AppInput } from 'components/common';
import styles from './UploadBuild.module.scss';

interface FileRowProps {
  file: File;
  fileKey: string;
  index: number;
  userType: 'user' | 'admin';
  tagValue: string;
  fileError?: string;
  isValidating: boolean;
  removeIconColor: string;
  onRemove: (index: number) => void;
  onTagChange: (fileKey: string, fileName: string, value: string) => void;
}

/**
 * FileRow - A single file entry showing name, optional tag input,
 * error message, and remove button.
 */
function FileRow({
  file,
  fileKey,
  index,
  userType,
  tagValue,
  fileError,
  isValidating,
  removeIconColor,
  onRemove,
  onTagChange,
}: FileRowProps) {
  return (
    <Box className={styles.fileRow}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <Stack direction="column" gap={0.5}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <CustomIcon
              name="hard-drive"
              size={16}
              color="var(--mui-palette-grey-500)"
            />
            <Typography variant="system2" className={styles.fileName}>
              {file.name}
            </Typography>
          </Stack>
          {fileError && (
            <Typography
              variant="caption"
              sx={{ color: 'error.main', fontSize: '11px', ml: 3 }}
            >
              {fileError}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" gap={1.5}>
          {userType === 'user' && (
            <Box sx={{ position: 'relative' }}>
              <AppInput
                placeholder="Tag/Short Description"
                value={tagValue}
                onChange={(e) =>
                  onTagChange(fileKey, file.name, e.target.value)
                }
                error={!!fileError}
              />
              {isValidating && (
                <CircularProgress
                  size={16}
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </Box>
          )}
          <Button
            onClick={() => onRemove(index)}
            className={styles.removeBtn}
            title={`Remove file ${file.name}`}
          >
            <CustomIcon name="x" size={18} color={removeIconColor} />
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default FileRow;
