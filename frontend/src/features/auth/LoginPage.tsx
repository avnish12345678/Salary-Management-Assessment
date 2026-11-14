import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useState } from 'react';
import { AcmeLogo, AcmeLogoMark } from '../../components/AcmeLogo';
import { useAuth } from './AuthContext';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const CHART_BARS = [
  { h: '42%', delay: '0.05s', color: '#14B8A6' },
  { h: '68%', delay: '0.15s', color: '#5EEAD4' },
  { h: '54%', delay: '0.25s', color: '#14B8A6' },
  { h: '88%', delay: '0.35s', color: '#FFFFFF' },
  { h: '62%', delay: '0.45s', color: '#5EEAD4' },
  { h: '76%', delay: '0.55s', color: '#14B8A6' },
  { h: '48%', delay: '0.65s', color: '#99F6E4' },
];

const METRIC_CARDS = [
  {
    className: 'acme-float',
    icon: GroupsOutlinedIcon,
    label: 'Workforce',
    value: '10,000',
    hint: 'multi-country employees',
  },
  {
    className: 'acme-float-delay',
    icon: PublicOutlinedIcon,
    label: 'Currencies',
    value: '8',
    hint: 'payroll kept currency-safe',
  },
  {
    className: 'acme-float',
    icon: TrendingUpOutlinedIcon,
    label: 'Revisions',
    value: 'Auditable',
    hint: 'every salary change traced',
  },
] as const;

function LoginShowcase() {
  return (
    <Box
      sx={{
        position: 'relative',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        overflow: 'hidden',
        px: { md: 5, lg: 7 },
        py: { md: 5, lg: 6 },
        color: '#EEF4F8',
        background:
          'radial-gradient(900px 520px at 18% 12%, rgba(20,184,166,0.28), transparent 55%), radial-gradient(700px 480px at 88% 78%, rgba(255,255,255,0.1), transparent 50%), linear-gradient(155deg, #071926 0%, #0B3D5C 48%, #0A5C56 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.22,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 0.8px, transparent 0.8px)',
          backgroundSize: 22,
          pointerEvents: 'none',
        }}
      />

      <Box
        className="acme-orbit"
        sx={{
          position: 'absolute',
          width: 420,
          height: 420,
          right: '-140px',
          top: '8%',
          borderRadius: '50%',
          border: `1px solid ${alpha('#FFFFFF', 0.12)}`,
          pointerEvents: 'none',
        }}
      >
        <Box
          className="acme-pulse-ring"
          sx={{
            position: 'absolute',
            inset: 48,
            borderRadius: '50%',
            border: `1px solid ${alpha('#14B8A6', 0.45)}`,
          }}
        />
      </Box>

      <Stack
        spacing={{ md: 3.5, lg: 4 }}
        sx={{ position: 'relative', zIndex: 1, height: '100%', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <AcmeLogoMark size={48} />
          <Box>
            <Typography
              sx={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontWeight: 700,
                fontSize: '1.85rem',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: '#FFFFFF',
              }}
            >
              ACME
            </Typography>
            <Typography
              sx={{
                mt: 0.4,
                fontSize: '0.85rem',
                fontWeight: 500,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: alpha('#EEF4F8', 0.72),
              }}
            >
              Salary Intelligence
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2} sx={{ flex: 1, justifyContent: 'center', minHeight: 0 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 1.5,
            }}
          >
            {METRIC_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Box
                  key={card.label}
                  className={card.className}
                  sx={{
                    minWidth: 0,
                    px: 1.5,
                    py: 1.5,
                    borderRadius: 2.5,
                    border: `1px solid ${alpha('#FFFFFF', 0.16)}`,
                    bgcolor: alpha('#071926', 0.42),
                    backdropFilter: 'blur(14px)',
                    boxShadow: '0 14px 32px rgba(7,25,38,0.22)',
                  }}
                >
                  <Stack direction="row" spacing={0.85} sx={{ alignItems: 'center', mb: 0.85 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.5,
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        bgcolor: alpha('#14B8A6', 0.2),
                        color: '#5EEAD4',
                      }}
                    >
                      <Icon sx={{ fontSize: 16 }} />
                    </Box>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ color: alpha('#EEF4F8', 0.72), fontWeight: 600 }}
                    >
                      {card.label}
                    </Typography>
                  </Stack>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: '1.15rem', color: '#FFFFFF', lineHeight: 1.2 }}
                  >
                    {card.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.35,
                      color: alpha('#EEF4F8', 0.62),
                      lineHeight: 1.35,
                    }}
                  >
                    {card.hint}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            className="acme-fade-up acme-fade-up-delay-2"
            sx={{
              px: 2,
              py: 1.75,
              borderRadius: 3,
              border: `1px solid ${alpha('#FFFFFF', 0.14)}`,
              bgcolor: alpha('#0B3D5C', 0.35),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: alpha('#EEF4F8', 0.7), fontWeight: 600, letterSpacing: '0.06em' }}
            >
              PAYROLL PULSE
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', height: 110, mt: 1.25 }}>
              {CHART_BARS.map((bar, index) => (
                <Box
                  key={index}
                  className="acme-bar-rise"
                  sx={{
                    flex: 1,
                    height: bar.h,
                    borderRadius: 1,
                    bgcolor: bar.color,
                    opacity: 0.92,
                    animationDelay: bar.delay,
                    boxShadow: bar.color === '#FFFFFF' ? '0 0 18px rgba(255,255,255,0.35)' : 'none',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            pt: 2.5,
            borderTop: `1px solid ${alpha('#FFFFFF', 0.14)}`,
            maxWidth: 420,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#5EEAD4',
              mb: 1,
            }}
          >
            Built for HR operations
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontWeight: 600,
              fontSize: { md: '1.45rem', lg: '1.65rem' },
              letterSpacing: '-0.025em',
              lineHeight: 1.25,
              color: '#FFFFFF',
            }}
          >
            Salary decisions, audited and currency-safe.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
        height: '100%',
        minHeight: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          overflow: 'hidden',
        }}
      >
        <LoginShowcase />

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            px: { xs: 2.5, sm: 4, md: 4.5, lg: 7 },
            py: { xs: 3, md: 4 },
            overflow: 'auto',
            background:
              'radial-gradient(640px 360px at 100% 0%, rgba(20,184,166,0.14), transparent 55%), linear-gradient(180deg, #F8FBFD 0%, #EEF4F8 52%, #E7EFF5 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.35,
              backgroundImage: 'radial-gradient(rgba(11,61,92,0.05) 0.7px, transparent 0.7px)',
              backgroundSize: 18,
              pointerEvents: 'none',
            }}
          />

          <Stack
            className="acme-fade-up"
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 460,
              mx: 'auto',
              my: 'auto',
              flex: 1,
              justifyContent: 'center',
              py: { xs: 1, md: 2 },
            }}
          >
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2.5 }}>
              <AcmeLogo />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: { xs: 460, md: 520 },
                p: { xs: 3, sm: 4 },
                borderRadius: 3.5,
                border: `1px solid ${alpha('#0B3D5C', 0.1)}`,
                bgcolor: alpha('#FFFFFF', 0.92),
                boxShadow: '0 20px 50px rgba(7, 25, 38, 0.08)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack spacing={1} sx={{ mb: 4 }}>
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'secondary.main',
                  }}
                >
                  Welcome back
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    letterSpacing: '-0.03em',
                    color: 'primary.main',
                    lineHeight: 1.15,
                  }}
                >
                  Sign in
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.55, pt: 0.35 }}>
                  Enter your ACME account to continue.
                </Typography>
              </Stack>

              <Box component="form" onSubmit={onSubmit} noValidate>
                <Stack spacing={2.75}>
                  <TextField
                    label="Email"
                    type="email"
                    autoComplete="username"
                    fullWidth
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    {...register('email')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: alpha('#EEF4F8', 0.55),
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha('#0B3D5C', 0.35),
                        },
                        '&.Mui-focused': {
                          bgcolor: '#FFFFFF',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0B3D5C',
                          borderWidth: 1.5,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#0B3D5C' },
                    }}
                  />
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    fullWidth
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    {...register('password')}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: alpha('#EEF4F8', 0.55),
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha('#0B3D5C', 0.35),
                        },
                        '&.Mui-focused': {
                          bgcolor: '#FFFFFF',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0B3D5C',
                          borderWidth: 1.5,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': { color: '#0B3D5C' },
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              onClick={() => setShowPassword((prev) => !prev)}
                              onMouseDown={(event) => event.preventDefault()}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  {submitError && <Alert severity="error">{submitError}</Alert>}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    fullWidth
                    sx={{ py: 1.55, mt: 0.75 }}
                  >
                    {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          flexShrink: 0,
          width: '100%',
          px: 2,
          py: 1.35,
          textAlign: 'center',
          borderTop: `1px solid ${alpha('#FFFFFF', 0.08)}`,
          bgcolor: '#071926',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 600,
            letterSpacing: '0.02em',
            lineHeight: 1.5,
            color: alpha('#EEF4F8', 0.88),
          }}
        >
          Powered by: Avnish paliwal (Asst Engineering Manager / 9672040353)
        </Typography>
      </Box>
    </Box>
  );
}
