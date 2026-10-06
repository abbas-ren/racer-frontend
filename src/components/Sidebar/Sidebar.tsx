import { AvatarIc, Logo, LogoutIc } from 'assets/index';
import CustomIcon from 'components/common/CustomIcon/CustomIcon';
import { APP_SIDEBAR_ROUTES, USER_APP_SIDEBAR_ROUTES } from 'constants/routes';
import { CustomSwitch } from 'components/common';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from 'hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from 'store/slices';
import { capitalizeWords, ROLES } from 'utils/common';
import useUsers from 'hooks/useUsers';
import { clearPersistedState, RootState } from 'store/store';
import useDevice from 'hooks/useDevice';
import { useUserDashboardWebSocket } from 'hooks/useUserDashboardWebSocket';
import { Box, Stack, Typography, Tooltip, Paper } from '@mui/material';
import { useNavigate } from 'react-router';
import styles from './SidebarStyles.module.scss';
import NavLinkText from 'components/NavLinkText';
import { TestStatus } from 'types/tests';

const Sidebar = () => {
  const [isDark, setIsDark] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const { user } = useAuth();

  useUserDashboardWebSocket(
    user?.id ?? '',
    user?.realmRoles?.includes(ROLES.User) ?? false,
  );

  const { requests } = useUsers();
  const { requestedDevice } = useDevice({
    isUser: user?.realmRoles?.includes(ROLES.User) ?? false,
  });

  // Count running test executions from open tabs
  const testExecutions = useSelector(
    (state: RootState) => state.testExecutions,
  );
  const runningTestsCount = useMemo(() => {
    return testExecutions.tabOrder.reduce((count, tabId) => {
      const tab = testExecutions.tabsById[tabId];
      const execution = tab?.values?.data?.testExecution;
      if (
        execution &&
        (execution.status === TestStatus.IN_PROGRESS ||
          execution.status === TestStatus.QUEUED)
      ) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [testExecutions.tabOrder, testExecutions.tabsById]);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsRotating(true);
    setIsDark(!isDark);
    setTimeout(() => setIsRotating(false), 300);
  };

  const handleLogout = () => {
    dispatch(logout());
    clearPersistedState();
    navigate('/login', { replace: true });
  };

  return (
    <Paper className={styles.sidebar}>
      <Box className={styles.sidebar__logo}>
        <Box component="img" src={Logo} alt="App Logo" />
      </Box>

      <Stack direction="column" className={styles.sidebar__list}>
        {user?.realmRoles?.includes(ROLES.User) &&
          USER_APP_SIDEBAR_ROUTES.map(({ name, path, iconName }) => (
            <NavLinkText
              key={name}
              name={name}
              icon={iconName ?? 'ellipsis'}
              path={path}
              runningTestsCount={runningTestsCount}
            />
          ))}

        {user?.realmRoles?.includes(ROLES.Admin) &&
          APP_SIDEBAR_ROUTES.map(({ name, path, iconName }) => (
            <NavLinkText
              key={name}
              name={name}
              icon={iconName ?? 'ellipsis'}
              path={path}
              userRequestCount={requests.length}
              deviceRequestCount={requestedDevice}
            />
          ))}
      </Stack>

      <Stack direction="column" sx={{ marginTop: 'auto', gap: '14px' }}>
        <Box className={styles.sidebar__settings_list}>
          <Box className={styles.theme_bar}>
            <CustomIcon
              name="sun"
              size={24}
              className={`${styles.sun_light_ic} ${isRotating ? styles.rotating : ''}`}
            />
            <Typography variant="buttonBase">Light Mode</Typography>
            <CustomSwitch checked={isDark} onChange={handleToggleTheme} />
          </Box>
        </Box>

        <Box onClick={handleLogout} className={styles.logout_btn}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Box className={styles.logout_btn__avatar}>
              <Box
                component="img"
                src={AvatarIc}
                alt="Profile Photo"
                sx={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
            </Box>

            <Stack
              direction="column"
              spacing={0.5}
              sx={{ flex: 1, minWidth: 0 }}
            >
              <Tooltip
                title={capitalizeWords(
                  (user?.firstName ?? '') + ' ' + (user?.lastName ?? '') ||
                    'Unknown',
                )}
                placement="top"
                arrow
              >
                <Typography variant="body2" className={styles.user_name}>
                  {capitalizeWords(
                    (user?.firstName ?? '') + ' ' + (user?.lastName ?? '') ||
                      'Unknown',
                  )}
                </Typography>
              </Tooltip>
              <Stack direction="row" alignItems="center" gap="6px">
                <Typography variant="caption" className={styles.username}>
                  {user?.username || 'username'}
                </Typography>
                <Box className={styles.status_indicator} />
              </Stack>
            </Stack>
          </Stack>
          <Box className={styles.logout_icon}>
            <Box component="img" src={LogoutIc} alt="logout" />
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default Sidebar;
