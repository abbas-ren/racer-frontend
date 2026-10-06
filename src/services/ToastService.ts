import { toast, ToastOptions, Id } from 'react-toastify';
import type { ReactNode } from 'react';

interface ToastServiceOptions extends Omit<ToastOptions, 'type'> {
  clearExisting?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

class ToastService {
  private activeToasts: Set<Id> = new Set();
  private defaultOptions: ToastOptions = {
    autoClose: 3000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    hideProgressBar: false,
    position: 'bottom-right',
  };

  configureDefaults(options: Partial<ToastOptions>) {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...options,
    };
  }

  private getDefaultOptions(): ToastOptions {
    return this.defaultOptions;
  }

  private clearAllToasts() {
    this.activeToasts.forEach((toastId) => toast.dismiss(toastId));
    this.activeToasts.clear();
  }

  private addToast(toastId: Id) {
    this.activeToasts.add(toastId);
  }

  private buildOptions(options: ToastServiceOptions): ToastOptions {
    const { onClick, onClose, ...rest } = options;
    return {
      ...this.getDefaultOptions(),
      ...rest,
      onClick: () => {
        onClick?.();
      },
      onClose: () => {
        onClose?.();
      },
    };
  }

  success(message: ReactNode, options: ToastServiceOptions = {}) {
    const { clearExisting = true } = options;
    if (clearExisting) this.clearAllToasts();
    const toastId = toast.success(message, this.buildOptions(options));
    this.addToast(toastId);
    return toastId;
  }

  error(message: ReactNode, options: ToastServiceOptions = {}) {
    const { clearExisting = true } = options;
    if (clearExisting) this.clearAllToasts();
    const toastId = toast.error(message, this.buildOptions(options));
    this.addToast(toastId);
    return toastId;
  }

  warning(message: ReactNode, options: ToastServiceOptions = {}) {
    const { clearExisting = true } = options;
    if (clearExisting) this.clearAllToasts();
    const toastId = toast.warning(message, this.buildOptions(options));
    this.addToast(toastId);
    return toastId;
  }

  info(message: ReactNode, options: ToastServiceOptions = {}) {
    const { clearExisting = true } = options;
    if (clearExisting) this.clearAllToasts();
    const toastId = toast.info(message, this.buildOptions(options));
    this.addToast(toastId);
    return toastId;
  }

  loading(message: ReactNode, options: ToastServiceOptions = {}) {
    const { clearExisting = true } = options;
    if (clearExisting) this.clearAllToasts();
    const toastId = toast.loading(message, this.buildOptions(options));
    this.addToast(toastId);
    return toastId;
  }

  update(
    toastId: Id,
    message: ReactNode,
    type: 'success' | 'error' | 'warning' | 'info',
    options: Omit<ToastServiceOptions, 'type'> = {},
  ) {
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      ...this.getDefaultOptions(),
      ...options,
    });
  }

  dismiss(toastId?: Id) {
    if (toastId) {
      toast.dismiss(toastId);
      this.activeToasts.delete(toastId);
    } else {
      this.clearAllToasts();
    }
  }

  clear() {
    this.clearAllToasts();
  }
}

export const toastService = new ToastService();
export default toastService;
