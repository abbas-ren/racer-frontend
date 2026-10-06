import { Box, Stack, Typography } from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './UploadBuild.module.scss';

interface UploadHeaderProps {
  iconColor: string;
}

/**
 * UploadHeader - Dialog header with upload icon, title, and subtitle.
 */
function UploadHeader({ iconColor }: UploadHeaderProps) {
  return (
    <Box className={styles.header}>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Stack className={styles.iconWrapPrimary}>
          <CustomIcon name="upload" size={24} color={iconColor} />
        </Stack>
        <Stack>
          <Typography className={styles.title} variant="legend">
            Upload New Build
          </Typography>
          <Typography className={styles.subtitle} variant="body3">
            Select files and upload
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default UploadHeader;
