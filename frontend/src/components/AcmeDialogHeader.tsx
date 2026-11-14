import { Box, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import type { ReactNode } from 'react';

type AcmeDialogHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose?: () => void;
};

export function AcmeDialogHeader({ title, subtitle, icon, onClose }: AcmeDialogHeaderProps) {
  return (
    <DialogTitle
      sx={{
        position: 'relative',
        m: 0,
        px: 2.5,
        py: 2,
        borderBottom: '1px solid',
        borderColor: alpha('#0B3D5C', 0.1),
        background:
          'linear-gradient(135deg, rgba(11,61,92,0.08) 0%, rgba(15,118,110,0.06) 50%, rgba(255,255,255,0.9) 100%)',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', pr: onClose ? 4.5 : 0 }}>
        {icon && (
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.25,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: alpha('#0B3D5C', 0.12),
              color: 'primary.main',
              border: `1px solid ${alpha('#0B3D5C', 0.12)}`,
              boxShadow: '0 8px 18px rgba(7,25,38,0.08)',
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1, pt: 0.15 }}>
          <Typography
            component="span"
            sx={{
              display: 'block',
              fontFamily: 'Fraunces, Georgia, serif',
              fontWeight: 600,
              fontSize: '1.25rem',
              letterSpacing: '-0.02em',
              color: 'primary.main',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.45, lineHeight: 1.45, maxWidth: 420 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {onClose && (
        <IconButton
          aria-label="Close dialog"
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            right: 14,
            top: 14,
            color: 'text.secondary',
            bgcolor: alpha('#FFFFFF', 0.85),
            border: `1px solid ${alpha('#0B3D5C', 0.12)}`,
            '&:hover': { bgcolor: alpha('#0B3D5C', 0.06), color: 'primary.main' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </DialogTitle>
  );
}
