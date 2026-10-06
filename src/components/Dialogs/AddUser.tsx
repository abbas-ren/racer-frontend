import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import styles from './Dialog.module.scss';
import ClearIcon from '@mui/icons-material/Clear';
import { ButtonPreset } from 'typesCustom/index';
import Button from 'components/common/Button';
import useRegistrationForm from 'hooks/useUserRegistration';
import { Controller } from 'react-hook-form';
import CustomInputField from 'components/common/InputField';
import { useDispatch } from 'react-redux';
import { stopResetForm } from 'store/slices';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  setOpenAddUserDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const AddUserDialog: React.FC<FormDialogProps> = ({
  open,
  onClose,
  setOpenAddUserDialog,
}) => {
  const {
    onSubmitByAdmin,
    errorsByAdmin,
    controlByAdmin,
    handleSubmitByAdmin,
    resetForm,
    loading,
    resetByAdmin,
  } = useRegistrationForm();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!resetForm) return;
    setOpenAddUserDialog(false);
    dispatch(stopResetForm());
  }, [resetForm, dispatch]);

  return (
    <Dialog
      TransitionComponent={Transition}
      open={open}
      onClose={() => {
        resetByAdmin();
        onClose();
      }}
    >
      <div className="flex flex-between p-r-lg">
        <DialogTitle>Add new user</DialogTitle>
        <div
          onClick={() => {
            resetByAdmin();
            onClose();
          }}
        >
          <ClearIcon className="cursor-pointer" />
        </div>
      </div>
      <DialogContent className={styles.dialog_content_wrapper}>
        <div className={styles['form_wrapper']}>
          <form onSubmit={handleSubmitByAdmin(onSubmitByAdmin)}>
            <div className={styles.login__form}>
              <Controller
                name="username"
                control={controlByAdmin}
                render={({ field }) => (
                  <CustomInputField
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    type="text"
                    customClasses={styles.users_form_control}
                    variant="filled"
                    placeholder="Username"
                    error={!!errorsByAdmin.username}
                    helperText={errorsByAdmin.username?.message}
                  />
                )}
              />
              <Controller
                name="email"
                control={controlByAdmin}
                render={({ field }) => (
                  <CustomInputField
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    type="text"
                    variant="filled"
                    placeholder="Email Address"
                    error={!!errorsByAdmin.email}
                    helperText={errorsByAdmin.email?.message}
                  />
                )}
              />
              <Controller
                name="firstName"
                control={controlByAdmin}
                render={({ field }) => (
                  <CustomInputField
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    type="text"
                    variant="filled"
                    placeholder="First Name"
                    error={!!errorsByAdmin.firstName}
                    helperText={errorsByAdmin.firstName?.message}
                  />
                )}
              />
              <Controller
                name="lastName"
                control={controlByAdmin}
                render={({ field }) => (
                  <CustomInputField
                    value={field.value}
                    onChange={field.onChange}
                    ref={field.ref}
                    type="text"
                    variant="filled"
                    placeholder="Last Name"
                    error={!!errorsByAdmin.lastName}
                    helperText={errorsByAdmin.lastName?.message}
                  />
                )}
              />
              <div className="m-t-lg p-0 flex flex-justify-end">
                <Button
                  type="submit"
                  size="large"
                  preset={ButtonPreset.Primary}
                >
                  {loading ? <div className="spinner"></div> : 'Add New User'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
