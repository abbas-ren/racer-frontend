import { Box, Button, Typography } from '@mui/material';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import styles from './UploadBuild.module.scss';

interface UploadFooterProps {
  disabled: boolean;
  onCancel: () => void;
  onUpload: () => void;
}

/**
 * UploadFooter - Dialog footer with Cancel and Upload buttons.
 */
function UploadFooter({ disabled, onCancel, onUpload }: UploadFooterProps) {
  return (
    <Box className={styles.footer}>
      <Button
        className={styles.btnCancel}
        onClick={onCancel}
        variant="outlined"
      >
        <Typography variant="button2">Cancel</Typography>
      </Button>
      <Button
        className={styles.uploadButton}
        startIcon={<CustomIcon name="upload" size={16} color="#ffffff" />}
        onClick={onUpload}
        disabled={disabled}
      >
        Upload New Build
      </Button>
    </Box>
  );
}

export default UploadFooter;
