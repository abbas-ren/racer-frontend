import { LoginBG, WhiteLogo } from 'assets/index';
import styles from './LoginStyles.module.scss';
import clsx from 'clsx';
import LoginTabs from 'components/LoginTabs';
import { useState, useEffect } from 'react';
import { Tab } from 'components/LoginTabs/LoginTabs';
import LoginForm from './LoginForm';
import RegistrationForm from './RegistrationForm';
import { useLocation, useSearchParams } from 'react-router';
// import ForgotPasswordForm from './ForgetPasswordForm';
// import ResetPasswordForm from './ResetPasswordForm';

const loginPageTabs: Tab[] = [
  {
    id: 0,
    label: 'Login',
  },
  {
    id: 1,
    label: 'New Request',
  },
];

export type modeType = 'login' | 'forgot-password' | 'reset-password';

const Login = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const location = useLocation();
  const [mode, setMode] = useState<modeType | null>(null);
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode') as modeType;
    const token = searchParams.get('ac') as string;
    setMode(mode);
    if (mode === 'reset-password' && (!token || token === '')) {
      setSearchParams({ ['mode']: 'login' });
    }
  }, [location.search]);

  const shouldShowLogin = !mode || mode === 'login';

  return (
    <div
      style={{
        background: `url(${LoginBG})`,
      }}
      className={styles.login}
    >
      <div className={clsx(styles.login__wrapper, 'flex flex-center')}>
        <div className={styles.login__card}>
          <img className={styles.logo} src={WhiteLogo} alt="Renesas" />
          {shouldShowLogin && (
            <>
              <LoginTabs
                tabs={loginPageTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
              {activeTab === 0 && <LoginForm />}
              {activeTab === 1 && <RegistrationForm />}
            </>
          )}
          {/* {mode === 'forgot-password' && <ForgotPasswordForm />}
          {mode === 'reset-password' && (
            <div>
              <h1 className={styles.card__heading}>Reset Password</h1>
              <ResetPasswordForm />
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default Login;
