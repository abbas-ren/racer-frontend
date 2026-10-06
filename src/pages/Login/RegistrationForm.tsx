import Button from 'components/common/Button';
import CustomInputField from 'components/common/InputField';
import styles from './LoginStyles.module.scss';
import useRegistrationForm from 'hooks/useUserRegistration';
import { useLoading } from 'context/LoadingContext';
import { useEffect } from 'react';
import { resetAuth, stopResetForm } from 'store/slices';
import { useDispatch } from 'react-redux';
import { Controller } from 'react-hook-form';
import Lottie from 'lottie-react';
import { SuccessAnimation } from 'assets/index';
import { clearPersistedState } from 'store/store';

const RegistrationForm = () => {
  const { onSubmit, errors, control, handleSubmit, resetForm, loading } =
    useRegistrationForm();
  const { setError } = useLoading();
  const dispatch = useDispatch();

  useEffect(() => {
    setError(null);
    clearPersistedState();
    dispatch(resetAuth());
  }, []);

  useEffect(() => {
    if (!resetForm) return;

    const RESET_TIMEOUT = 20000;

    const timeoutId = setTimeout(() => {
      if (resetForm) {
        dispatch(stopResetForm());
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
            Your request has been submitted successfully. You will receive an
            email once the admin approves your request.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.login__form}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <CustomInputField
                  value={field.value}
                  onChange={field.onChange}
                  ref={field.ref}
                  type="text"
                  variant="filled"
                  placeholder="Username"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <CustomInputField
                  value={field.value}
                  onChange={field.onChange}
                  ref={field.ref}
                  type="text"
                  variant="filled"
                  placeholder="Email Address"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <CustomInputField
                  value={field.value}
                  onChange={field.onChange}
                  ref={field.ref}
                  type="text"
                  variant="filled"
                  placeholder="First Name"
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              )}
            />
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <CustomInputField
                  value={field.value}
                  onChange={field.onChange}
                  ref={field.ref}
                  type="text"
                  variant="filled"
                  placeholder="Last Name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              )}
            />
            <Button type="submit" className={styles.login__button}>
              {loading ? <div className="spinner"></div> : 'Request'}
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default RegistrationForm;
