import { useEffect } from 'react';
import toastService from 'services/ToastService';

export function useDevicePowerToggle(powerToggleError: string | null) {
  useEffect(() => {
    if (powerToggleError) {
      toastService.error(powerToggleError);
    }
  }, [powerToggleError]);
}
