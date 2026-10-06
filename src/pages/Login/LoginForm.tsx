import useLoginForm from 'hooks/useLogin';
import styles from './LoginStyles.module.scss';
import { Controller } from 'react-hook-form';
import CustomInputField from 'components/common/InputField';
import Button from 'components/common/Button';
import { useLoading } from 'context/LoadingContext';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { resetAuth } from 'store/slices';
// import { useSearchParams } from 'react-router';
import { clearPersistedState } from 'store/store';

const LoginForm = () => {
  const { onSubmit, errors, control, handleSubmit, loading } = useLoginForm();
  const { setError } = useLoading();
  const dispatch = useDispatch();
  // const [, setSearchParams] = useSearchParams();
  useEffect(() => {
    setError(null);
    clearPersistedState();
    dispatch(resetAuth());
  }, []);

  // const redirectToForgotPassword = () => {
  //   setSearchParams({ ['mode']: 'forgot-password' });
  // };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.login__form}>
        <Controller
          name="emailOrUsername"
          control={control}
          render={({ field }) => (
            <CustomInputField
              type="text"
              variant="filled"
              value={field.value}
              onChange={field.onChange}
              ref={field.ref}
              placeholder="Username or Email ID"
              error={!!errors.emailOrUsername}
              helperText={errors.emailOrUsername?.message}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <CustomInputField
              type="password"
              variant="filled"
              placeholder="Password"
              value={field.value}
              onChange={field.onChange}
              ref={field.ref}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
          )}
        />
        {/* <p
          onClick={redirectToForgotPassword}
          className={styles.forgot_password}
        >
          Forgot Password?
        </p> */}
        <Button
          type="submit"
          className={styles.login__button}
          disabled={loading}
        >
          {loading ? <div className="spinner"></div> : 'Login'}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
