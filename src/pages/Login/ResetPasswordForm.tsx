import useLoginForm from 'hooks/useLogin';
import styles from './LoginStyles.module.scss';
import { Controller } from 'react-hook-form';
import CustomInputField from 'components/common/InputField';
import Button from 'components/common/Button';
import { useLoading } from 'context/LoadingContext';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { resetAuth, stopResetForm } from 'store/slices';
import Lottie from 'lottie-react';
import { SuccessAnimation } from 'assets/index';
import { useSearchParams } from 'react-router';
import { clearPersistedState } from 'store/store';

const ResetPasswordForm = () => {
  const {
    resetPasswordControl,
    resetPasswordErrors,
    onSubmitResetPassword,
    resetPasswordSubmit,
    resetForm,
    validateTokenAndUser,
    validationLoading,
    loading,
  } = useLoginForm();

  const { setError } = useLoading();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isInfoValid, setIsInfoValid] = useState(true);

  useEffect(() => {
    setError(null);
    clearPersistedState();
    dispatch(resetAuth());
    checkValidation();
  }, []);

  const checkValidation = async () => {
    const userId = searchParams.get('ui') || '';
    const token = searchParams.get('ac') || '';
    const isValid = await validateTokenAndUser(token, userId);
    setIsInfoValid(isValid);
  };

  useEffect(() => {
    if (!resetForm) return;

    const timeoutId = setTimeout(() => {
      dispatch(stopResetForm());
      setSearchParams({ mode: 'login' });
    }, 3500);

    return () => clearTimeout(timeoutId);
  }, [resetForm]);

  if (validationLoading) {
    return (
      <div className={styles.spinner_container}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isInfoValid) {
    return (
      <div className={styles.validation_error_text}>
        The link has expired! Please contact the Administrator.
      </div>
    );
  }

  if (resetForm) {
    return (
      <div className={styles.success_container}>
        <Lottie
          className={styles.success_animation}
          animationData={SuccessAnimation}
          loop
        />
        <p>
          Your password has been successfully changed. Redirecting to login...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={resetPasswordSubmit(onSubmitResetPassword)}>
      <div className={styles.login__form}>
        <Controller
          name="password"
          control={resetPasswordControl}
          render={({ field }) => (
            <CustomInputField
              type="password"
              variant="filled"
              placeholder="New Password"
              {...field}
              error={!!resetPasswordErrors.password}
              helperText={resetPasswordErrors.password?.message}
            />
          )}
        />
        <Controller
          name="confirmPassword"
          control={resetPasswordControl}
          render={({ field }) => (
            <CustomInputField
              type="password"
              variant="filled"
              placeholder="Confirm Password"
              {...field}
              error={!!resetPasswordErrors.confirmPassword}
              helperText={resetPasswordErrors.confirmPassword?.message}
            />
          )}
        />
        <Button type="submit" className={styles.login__button}>
          {loading ? <div className="spinner"></div> : 'Reset Password'}
        </Button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
