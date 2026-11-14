import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { changePasswordRequest } from '../../services/auth-service';
import { formatDate } from '../../utils/format';
import type { Role } from '../../types/auth';
import { useAuth } from '../auth/AuthContext';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'Choose a password different from your current one',
    path: ['newPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ROLE_COPY: Record<Role, { title: string; summary: string }> = {
  SUPER_ADMIN: {
    title: 'Super Admin',
    summary: 'Full platform access including audit write and settings administration.',
  },
  HR_MANAGER: {
    title: 'HR Manager',
    summary: 'Manage workforce, salaries, reports, exports, and audit review.',
  },
  HR_EXECUTIVE: {
    title: 'HR Executive',
    summary: 'Maintain employee records and view salary/report information.',
  },
  VIEWER: {
    title: 'Viewer',
    summary: 'Read-only access to employees, salaries, dashboard, and reports.',
  },
};

const PERMISSION_GROUPS: { title: string; permissions: string[] }[] = [
  {
    title: 'Workforce',
    permissions: ['employees:read', 'employees:write'],
  },
  {
    title: 'Compensation',
    permissions: ['salaries:read', 'salaries:write'],
  },
  {
    title: 'Insights',
    permissions: ['dashboard:read', 'reports:read', 'reports:export'],
  },
  {
    title: 'Governance',
    permissions: ['audit:read', 'audit:write', 'settings:write'],
  },
];

const PERMISSION_LABELS: Record<string, string> = {
  'employees:read': 'View employees',
  'employees:write': 'Edit employees',
  'salaries:read': 'View salaries',
  'salaries:write': 'Revise salaries',
  'dashboard:read': 'View dashboard',
  'reports:read': 'View reports',
  'reports:export': 'Export reports',
  'audit:read': 'View audit logs',
  'audit:write': 'Write audit events',
  'settings:write': 'Manage settings',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FFFFFF',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha('#0B3D5C', 0.35),
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#0B3D5C',
      borderWidth: 1.5,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#0B3D5C',
  },
};

function PasswordField({
  label,
  visible,
  onToggle,
  error,
  helperText,
  autoComplete,
  registration,
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
  error?: boolean;
  helperText?: string;
  autoComplete: string;
  registration: ReturnType<ReturnType<typeof useForm<PasswordFormValues>>['register']>;
}) {
  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      error={error}
      helperText={helperText}
      fullWidth
      sx={fieldSx}
      {...registration}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                onClick={onToggle}
                onMouseDown={(event) => event.preventDefault()}
                edge="end"
              >
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const roleInfo = useMemo(() => (user ? ROLE_COPY[user.role] : null), [user]);
  const permissionSet = useMemo(() => new Set(user?.permissions ?? []), [user]);

  if (!user || !roleInfo) {
    return <Alert severity="warning">Unable to load your account settings.</Alert>;
  }

  const onChangePassword = handleSubmit(async (values) => {
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const result = await changePasswordRequest(values);
      setPasswordSuccess(result.message);
      reset();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setPasswordError(error.response?.data?.error?.message ?? 'Could not update password');
      } else {
        setPasswordError('Could not update password');
      }
    }
  });

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Box
      className="acme-fade-up"
      sx={{
        width: '100%',
        minHeight: { md: 'calc(100vh - 120px)' },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Grid container spacing={2} sx={{ flex: 1, alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
          <Paper
            sx={{
              width: '100%',
              height: '100%',
              minHeight: { md: '100%' },
              borderRadius: 3,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                pt: 3,
                pb: 2.5,
                background:
                  'linear-gradient(160deg, rgba(11,61,92,0.12) 0%, rgba(15,118,110,0.08) 42%, rgba(255,255,255,0.2) 100%)',
                borderBottom: `1px solid ${alpha('#0B3D5C', 0.08)}`,
                textAlign: 'center',
              }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  mx: 'auto',
                  mb: 1.5,
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  bgcolor: '#0B3D5C',
                  color: '#FFFFFF',
                  boxShadow: '0 12px 28px rgba(7,25,38,0.22)',
                }}
              >
                {user.email[0]?.toUpperCase() ?? 'U'}
              </Avatar>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: 'primary.main', wordBreak: 'break-word', px: 0.5 }}
              >
                {user.email}
              </Typography>
              <Chip
                size="small"
                label={roleInfo.title}
                sx={{
                  mt: 1,
                  fontWeight: 700,
                  bgcolor: alpha('#0F766E', 0.12),
                  color: '#0F766E',
                  border: `1px solid ${alpha('#0F766E', 0.18)}`,
                }}
              />
            </Box>

            <Stack spacing={0} sx={{ px: 2.5, py: 1.5, flex: 1 }}>
              {[
                { label: 'Status', value: user.isActive ? 'Active' : 'Inactive' },
                { label: 'Member since', value: formatDate(user.createdAt) },
                { label: 'Role scope', value: roleInfo.summary },
              ].map((row, index, arr) => (
                <Box
                  key={row.label}
                  sx={{
                    py: 1.35,
                    borderBottom:
                      index < arr.length - 1 ? `1px solid ${alpha('#0B3D5C', 0.08)}` : 'none',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                    {row.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: row.label === 'Role scope' ? 500 : 600,
                      color: 'text.primary',
                      lineHeight: 1.45,
                    }}
                  >
                    {row.value}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Box sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<LogoutOutlinedIcon />}
                onClick={() => void onLogout()}
                disabled={loggingOut}
              >
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mt: 1.25,
                  textAlign: 'center',
                  fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
                  wordBreak: 'break-all',
                  lineHeight: 1.4,
                }}
              >
                {user.id}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
          <Stack spacing={2} sx={{ width: '100%', flex: 1 }}>
            <Paper sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha('#0B3D5C', 0.1),
                    color: 'primary.main',
                  }}
                >
                  <LockOutlinedIcon fontSize="small" />
                </Box>
                <Typography variant="h6" sx={{ color: 'primary.main', lineHeight: 1.2 }}>
                  Security
                </Typography>
              </Stack>

              <Box component="form" onSubmit={onChangePassword} noValidate sx={{ width: '100%' }}>
                <Stack spacing={1.75}>
                  {passwordError && <Alert severity="error">{passwordError}</Alert>}
                  {passwordSuccess && <Alert severity="success">{passwordSuccess}</Alert>}

                  <Grid container spacing={1.75}>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <PasswordField
                        label="Current password"
                        visible={showCurrent}
                        onToggle={() => setShowCurrent((v) => !v)}
                        error={Boolean(errors.currentPassword)}
                        helperText={errors.currentPassword?.message}
                        autoComplete="current-password"
                        registration={register('currentPassword')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <PasswordField
                        label="New password"
                        visible={showNew}
                        onToggle={() => setShowNew((v) => !v)}
                        error={Boolean(errors.newPassword)}
                        helperText={errors.newPassword?.message}
                        autoComplete="new-password"
                        registration={register('newPassword')}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 4 }}>
                      <PasswordField
                        label="Confirm new password"
                        visible={showConfirm}
                        onToggle={() => setShowConfirm((v) => !v)}
                        error={Boolean(errors.confirmPassword)}
                        helperText={errors.confirmPassword?.message}
                        autoComplete="new-password"
                        registration={register('confirmPassword')}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ pt: 0.5 }}>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating…' : 'Update password'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </Paper>

            <Paper
              sx={{
                borderRadius: 3,
                p: { xs: 2, sm: 2.5, md: 3 },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 0.35 }}>
                Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Access granted by your {roleInfo.title} role.
              </Typography>

              <Grid container spacing={1.5} sx={{ flex: 1 }}>
                {PERMISSION_GROUPS.map((group) => {
                  const items = group.permissions.filter((p) => permissionSet.has(p));
                  if (items.length === 0) return null;
                  return (
                    <Grid key={group.title} size={{ xs: 12, sm: 6, xl: 3 }} sx={{ display: 'flex' }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          p: 1.75,
                          borderRadius: 2,
                          border: `1px solid ${alpha('#0B3D5C', 0.1)}`,
                          bgcolor: alpha('#EEF4F8', 0.45),
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{ color: 'secondary.main', display: 'block', mb: 1, lineHeight: 1 }}
                        >
                          {group.title}
                        </Typography>
                        <Stack spacing={0.75}>
                          {items.map((permission) => (
                            <Stack
                              key={permission}
                              direction="row"
                              spacing={0.75}
                              sx={{ alignItems: 'center' }}
                            >
                              <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: '#0F766E' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {PERMISSION_LABELS[permission] ?? permission}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
