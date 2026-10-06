import { Box } from '@mui/material';
import { Outlet } from 'react-router';
import styles from './Container.module.scss';
import { Sidebar } from 'components';

function UserContainer({ isOriginalRoutes = true }) {
  return (
    <>
      <Box className={styles.container}>
        <Sidebar />
        <div id="main-content" className={styles.inner__container}>
          {/* <Navbar /> */}
          {isOriginalRoutes && (
            <Box
              component="main"
              sx={{ width: '100%', height: '100%', overflow: 'auto' }}
            >
              <Outlet />
            </Box>
          )}
        </div>
      </Box>
    </>
  );
}

export default UserContainer;
