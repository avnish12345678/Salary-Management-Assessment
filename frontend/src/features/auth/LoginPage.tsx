import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'hr.manager@acme.example',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setSubmitError(error.response?.data?.error?.message ?? 'Login failed');
      } else {
        setSubmitError('Login failed');
      }
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(circle at top left, rgba(15,118,110,0.18), transparent 40%), linear-gradient(160deg, #0B3D5C 0%, #102A43 45%, #0F766E 100%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, border: 'none', boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="overline" color="secondary" sx={{ fontWeight: 700 }}>
              ACME
            </Typography>
            <Typography variant="h4">Sign in</Typography>
            <Typography color="text.secondary">
              HR Salary Intelligence Platform for enterprise workforce operations.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                autoComplete="username"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                fullWidth
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register('password')}
              />
              {submitError && <Alert severity="error">{submitError}</Alert>}
              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
