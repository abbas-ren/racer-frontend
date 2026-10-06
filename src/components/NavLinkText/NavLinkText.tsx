import { NavLink } from 'react-router';
import styles from './NavLinkText.module.scss';
import clsx from 'clsx';
import { Box, Stack, Typography } from '@mui/material';
import CustomIcon from 'components/common/CustomIcon';
import { IconName } from 'lucide-react/dynamic';

interface NavLinkTextProps {
  icon: IconName;
  path: string;
  name: string;
  userRequestCount?: number;
  deviceRequestCount?: number;
  runningTestsCount?: number;
}

function NavLinkText({
  icon,
  path,
  name,
  userRequestCount,
  deviceRequestCount,
  runningTestsCount,
}: NavLinkTextProps) {
  const showUsersCount = (name: string) =>
    name === 'Users' && userRequestCount! > 0;
  const showDeviceCount = (name: string) =>
    name === 'Devices' && deviceRequestCount! > 0;
  const showTestsCount = (name: string) =>
    name === 'Tests' && runningTestsCount! > 0;

  return (
    <NavLink to={path} className={styles['nav-link']}>
      {({ isActive }) => (
        <Stack
          direction="row"
          alignItems="center"
          gap="9px"
          className={clsx(styles.list_item, { [styles.active]: isActive })}
        >
          {isActive && (
            <>
              <Box className={styles.left_bar} />
              <Box className={styles.indicator} />
            </>
          )}
          <CustomIcon
            name={icon}
            color={
              isActive
                ? 'var(--mui-palette-primary-300)'
                : 'var(--mui-palette-grey-600)'
            }
            size={27}
            width={1.5}
          />
          <Typography
            variant="body1"
            sx={{
              fontWeight: 400,
              lineHeight: 'normal',
              transition: 'all 200ms',
              color: 'inherit',
              '.list_item:hover &': {
                fontWeight: 700,
              },
            }}
          >
            {name}
          </Typography>
          {showUsersCount(name) && (
            <Box className={styles.notification_count}>
              <Typography variant="caption">{10}</Typography>
            </Box>
          )}
          {showDeviceCount(name) && (
            <Box className={styles.notification_count}>
              <Typography variant="caption">{deviceRequestCount}</Typography>
            </Box>
          )}
          {showTestsCount(name) && (
            <Box className={styles.notification_count}>
              <Typography variant="caption">{runningTestsCount}</Typography>
            </Box>
          )}
        </Stack>
      )}
    </NavLink>
  );
}

export default NavLinkText;
