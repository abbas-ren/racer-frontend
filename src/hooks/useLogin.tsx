import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLoading } from 'context';
import {
  forgotPasswordRequest,
  loginRequest,
  resetPasswordRequest,
  startResetForm,
  RootState,
} from 'store';
import { isEmpty, ROLES } from 'utils/common';
import { SIDEBAR_ROUTES, USER_SIDEBAR_ROUTES } from 'constants/routes';
import { validateTokenAndUser } from 'services/authApiService';

const loginSchema = yup.object().shape({
  emailOrUsername: yup.string().required('Email or Username is required'),
  password: yup.string().required('Password is required').min(8),
});

const forgotSchema = yup.object().shape({
  emailOrUsername: yup.string().required('Email or Username is required'),
});

const resetSchema = yup.object().shape({
  password: yup.string().required('Password is required').min(8),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirmation is required'),
});

const useLoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setError, setLoading, setSuccess } = useLoading();
  const [currentToken, setCurrentToken] = useState({ token: '', userId: '' });
  const [validationLoading, setValidationLoading] = useState(false);

  const { loading, error, token, resetForm, message, user } = useSelector(
    (state: RootState) => state.auth,
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setCurrentToken({
      token: searchParams.get('ac') || '',
      userId: searchParams.get('ui') || '',
    });
  }, [location.search]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: { emailOrUsername: '', password: '' },
  });

  const {
    control: forgotPasswordControl,
    handleSubmit: forgotPasswordSubmit,
    formState: { errors: forgotPasswordErrors },
    reset: resetForgotPasswordForm,
  } = useForm({
    resolver: yupResolver(forgotSchema),
    defaultValues: { emailOrUsername: '' },
  });

  const {
    control: resetPasswordControl,
    handleSubmit: resetPasswordSubmit,
    formState: { errors: resetPasswordErrors },
    reset: resetResetPasswordForm,
  } = useForm({
    resolver: yupResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (data: { emailOrUsername: string; password: string }) => {
    if (isEmpty(errors)) {
      dispatch(loginRequest(data));
    }
  };

  const onSubmitForgotPassword = (data: { emailOrUsername: string }) => {
    if (isEmpty(forgotPasswordErrors)) {
      dispatch(forgotPasswordRequest(data));
    }
  };

  const onSubmitResetPassword = (data: {
    password: string;
    confirmPassword: string;
  }) => {
    setError('');
    if (!currentToken.token || !currentToken.userId) {
      setError('The link is expired!');
      return;
    }
    if (isEmpty(resetPasswordErrors)) {
      dispatch(
        resetPasswordRequest({
          password: data.password,
          userId: currentToken.userId,
          token: currentToken.token,
        }),
      );
    }
  };

  useEffect(() => {
    if (token && user?.realmRoles.includes(ROLES.Admin)) {
      navigate('/' + SIDEBAR_ROUTES.default);
    } else if (token && user?.realmRoles.includes(ROLES.User)) {
      navigate('/' + USER_SIDEBAR_ROUTES.default);
    }
  }, [token, user, navigate]);

  useEffect(() => {
    setLoading(loading);
    setSuccess('');
    setError('');
    if (error) setError(error);
    if (message) {
      resetForgotPasswordForm();
      dispatch(startResetForm());
    }
  }, [loading, error, message]);

  const validateToken = async (token: string, userId: string) => {
    setValidationLoading(true);
    const isValid = await validateTokenAndUser(token, userId);
    setValidationLoading(false);
    return isValid;
  };

  return {
    control,
    handleSubmit,
    errors,
    onSubmit,
    forgotPasswordControl,
    forgotPasswordSubmit,
    forgotPasswordErrors,
    onSubmitForgotPassword,
    resetPasswordControl,
    resetPasswordSubmit,
    resetPasswordErrors,
    onSubmitResetPassword,
    resetResetPasswordForm,
    resetForm,
    validateTokenAndUser: validateToken,
    validationLoading,
    loading,
  };
};

export default useLoginForm;
