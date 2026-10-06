import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { isEmpty, ROLES } from 'utils/common';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLoading } from 'context';
import {
  clearAuthMessages,
  registerRequest,
  RootState,
  startResetForm,
} from 'store';
import toastService from 'services/ToastService';

const schema = yup.object().shape({
  email: yup.string().required('Email is required').email(),
  username: yup.string().required('Username is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
});

interface RegistrationData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

const defaultValues = { username: '', email: '', firstName: '', lastName: '' };

const useRegistrationForm = () => {
  const dispatch = useDispatch();
  const { loading, error, message, resetForm } = useSelector(
    (state: RootState) => state.auth,
  );
  const { error: userError, message: userMessage } = useSelector(
    (state: RootState) => state.auth,
  );
  const { setError, setLoading, setSuccess } = useLoading();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });
  const lastMessageRef = useRef<string | null>(null);

  const {
    control: controlByAdmin,
    handleSubmit: handleSubmitByAdmin,
    reset: resetByAdmin,
    formState: { errors: errorsByAdmin },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  function onSubmit(data: RegistrationData) {
    if (isEmpty(errors)) {
      dispatch(
        registerRequest({
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          isAdmin: false,
        }),
      );
    }
  }
  function onSubmitByAdmin(data: RegistrationData) {
    if (isEmpty(errors)) {
      dispatch(
        registerRequest({
          email: data.email,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          role: ROLES.User,
          isAdmin: true,
        }),
      );
    }
  }

  useEffect(() => {
    setLoading(loading);
    setSuccess('');
    setError('');
    if (error) setError(error);
    if (message) {
      reset(defaultValues);
      resetByAdmin(defaultValues);
      dispatch(startResetForm());
    }
  }, [loading, error, setLoading, setError]);

  useEffect(() => {
    if (userMessage) {
      const timeout = setTimeout(() => {
        toastService.success(userMessage);
        lastMessageRef.current = userMessage;
        dispatch(clearAuthMessages());
      }, 160);
      return () => clearTimeout(timeout);
    }
    if (userError) {
      const timeout = setTimeout(() => {
        toastService.error(userError);
        lastMessageRef.current = userError;
        dispatch(clearAuthMessages());
      }, 160);
      return () => clearTimeout(timeout);
    }
  }, [userError, userMessage]);

  return {
    onSubmit,
    control,
    errors,
    handleSubmit,
    resetForm,
    controlByAdmin,
    resetByAdmin,
    errorsByAdmin,
    handleSubmitByAdmin,
    onSubmitByAdmin,
    loading,
    reset,
  };
};

export default useRegistrationForm;
