import { CircularProgress, Typography } from '@mui/material';
import styles from './CenterLoader.module.scss';

function CenterLoader({ text }: { text?: string }) {
  return (
    <Typography
      className={styles.notAvailableLabel}
      variant="h6"
      color="text.subtitle"
    >
      {text ? text : null}
      <CircularProgress />
    </Typography>
  );
}

export default CenterLoader;
