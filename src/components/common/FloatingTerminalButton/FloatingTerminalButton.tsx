import { IconButton } from '@mui/material';
import { TerminalWhite } from 'assets/index';
import styles from './FloatingTerminalButton.module.scss';

interface FloatingTerminalButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const FloatingTerminalButton = ({
  onClick,
  disabled,
}: FloatingTerminalButtonProps) => {
  const handleClick = () => {
    onClick();
  };

  return (
    <IconButton
      className={styles.floatingButton}
      onClick={handleClick}
      aria-label="Open terminal"
      style={{
        right: 16,
        bottom: 16,
      }}
      disabled={disabled}
    >
      <TerminalWhite />
    </IconButton>
  );
};

export default FloatingTerminalButton;
