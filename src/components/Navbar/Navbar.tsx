import { ADMIN_NAVBAR } from 'constants/routes';
import styles from './NavbarStyles.module.scss';
import { NavLink } from 'react-router';
import { AlertIcon } from 'assets/index';
import useAlerts from 'hooks/useAlerts';
import { useRef, useState } from 'react';
import AlertsAlarmsPopup from 'components/AlertPopup/AlertPopup';

const Navbar = () => {
  const {
    data,
    handleReadAlert,
    unreadCount,
    setPage,
    totalPages,
    page,
    markAllRead,
  } = useAlerts();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setAnchorEl(buttonRef.current);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };
  return (
    <div className={styles.navbar}>
      {ADMIN_NAVBAR.map((nav) => (
        <NavLink key={nav.path} to={nav.path} className={styles['nav-link']}>
          {nav.name}
        </NavLink>
      ))}
      <div
        className={styles.alerts_container}
        onClick={handleClick}
        ref={buttonRef}
      >
        <img src={AlertIcon} alt="alerts" />
        {unreadCount > 0 && <p>{unreadCount}</p>}
      </div>
      <AlertsAlarmsPopup
        open={open}
        onClose={handleClose}
        alerts={data}
        anchorEl={anchorEl}
        handleClick={handleReadAlert}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        markAllRead={markAllRead}
        totalUnread={unreadCount}
      />
    </div>
  );
};

export default Navbar;
