import useLoginForm from 'hooks/useLogin';
import styles from './LoginStyles.module.scss';
import { Controller } from 'react-hook-form';
import CustomInputField from 'components/common/InputField';
import Button from 'components/common/Button';
import { useLoading } from 'context/LoadingContext';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { resetAuth, stopResetForm } from 'store/slices';
import Lottie from 'lottie-react';
import { SuccessAnimation } from 'assets/index';
import { useSearchParams } from 'react-router';

const ForgotPasswordForm = () => {
  const {
    forgotPasswordControl,
    forgotPasswordErrors,
    onSubmitForgotPassword,
    forgotPasswordSubmit,
    resetForm,
    loading,
  } = useLoginForm();
  const { setError } = useLoading();
  const dispatch = useDispatch();
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    setError(null);
    dispatch(resetAuth());
  }, []);

  useEffect(() => {
    if (!resetForm) return;

    const RESET_TIMEOUT = 20000;

    const timeoutId = setTimeout(() => {
      if (resetForm) {
        dispatch(stopResetForm());
        setSearchParams({ ['mode']: 'login' });
      }
    }, RESET_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [resetForm, dispatch]);

  return (
    <>
      {resetForm ? (
        <div className={styles.success_container}>
          <Lottie
            className={styles.success_animation}
            animationData={SuccessAnimation}
            loop={true}
          />
          <p>
            An email has been sent to your registered address. Please check your
            inbox and follow the instructions to reset your password.
          </p>
        </div>
      ) : (
        <form onSubmit={forgotPasswordSubmit(onSubmitForgotPassword)}>
          <div className={styles.login__form}>
            <Controller
              name="emailOrUsername"
              control={forgotPasswordControl}
              render={({ field }) => (
                <CustomInputField
                  type="text"
                  variant="filled"
                  value={field.value}
                  onChange={field.onChange}
                  ref={field.ref}
                  placeholder="Username or Email ID"
                  error={!!forgotPasswordErrors.emailOrUsername}
                  helperText={forgotPasswordErrors.emailOrUsername?.message}
                />
              )}
            />
            <Button type="submit" className={styles.login__button}>
              {loading ? <div className="spinner"></div> : 'Reset Password'}
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default ForgotPasswordForm;
