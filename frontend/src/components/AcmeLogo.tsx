import { Box, Stack, Typography } from '@mui/material';

type AcmeLogoProps = {
  compact?: boolean;
  showWordmark?: boolean;
};

export function AcmeLogoMark({ size = 36 }: { size?: number }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      sx={{ display: 'block', flexShrink: 0 }}
    >
      <rect width="40" height="40" rx="10" fill="#0B3D5C" />
      <path
        d="M8 27.5V12.5L20 8.5L32 12.5V27.5L20 31.5L8 27.5Z"
        stroke="#14B8A6"
        strokeWidth="1.5"
        fill="rgba(20,184,166,0.12)"
      />
      <path d="M14 24.5V18.2L20 16.2L26 18.2V24.5" stroke="#EEF4F8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 24.5L20 26.6L26 24.5" stroke="#EEF4F8" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17.2 22.8V20.1H18.8V22.8" stroke="#14B8A6" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M21.2 22.8V19.2H22.8V22.8" stroke="#14B8A6" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="20" cy="14.2" r="1.35" fill="#14B8A6" />
    </Box>
  );
}

export function AcmeLogo({ compact = false, showWordmark = true }: AcmeLogoProps) {
  return (
    <Stack direction="row" spacing={1.15} sx={{ alignItems: 'center', minWidth: 0 }}>
      <AcmeLogoMark size={compact ? 32 : 36} />
      {showWordmark && (
        <Box sx={{ minWidth: 0, lineHeight: 1.1 }}>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontFamily: 'Fraunces, Georgia, serif',
              fontWeight: 700,
              fontSize: compact ? '1rem' : '1.15rem',
              color: 'primary.main',
              letterSpacing: '-0.02em',
            }}
          >
            ACME
          </Typography>
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontWeight: 500,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
            }}
          >
            Salary Intelligence
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
