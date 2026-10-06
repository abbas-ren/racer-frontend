import { Box, Stack } from '@mui/material';
import { useAuth } from 'hooks/useAuth';
import { ROLES } from 'utils/common';

const getManualUrl = (role: 'admin' | 'user' | null) => {
  const base =
    import.meta.env.VITE_USER_MANUAL_URL ?? `${window.location.origin}/docs`;
  if (!role) return base;

  try {
    const url = new URL(base, window.location.origin);
    url.searchParams.set('role', role);
    return url.toString();
  } catch {
    const [path, hash = ''] = base.split('#');
    const separator = path.includes('?') ? '&' : '?';
    const next = `${path}${separator}role=${role}`;
    return hash ? `${next}#${hash}` : next;
  }
};

const UserManual = () => {
  const { user } = useAuth();
  const role = user?.realmRoles?.includes(ROLES.Admin) ? 'admin' : 'user';

  const manualUrl = getManualUrl(role);

  return (
    <Stack
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        component="iframe"
        src={manualUrl}
        title="User Manual"
        sx={{
          width: '100%',
          height: '100%',
          border: 'none',
          flex: 1,
        }}
      />
    </Stack>
  );
};

export default UserManual;
