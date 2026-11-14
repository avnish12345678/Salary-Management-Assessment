import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AcmeDialogHeader } from '../../components/AcmeDialogHeader';
import type { SalaryRecord } from '../../types/api';
import { formatMoney } from '../../utils/format';
import { reviseSalary } from '../../services/salaries-service';

const ACME_CURRENCIES = ['AUD', 'CAD', 'EUR', 'GBP', 'INR', 'JPY', 'SGD', 'USD'] as const;

const CURRENCY_FLAG_COUNTRY: Record<string, { code: string; name: string }> = {
  USD: { code: 'us', name: 'United States' },
  INR: { code: 'in', name: 'India' },
  GBP: { code: 'gb', name: 'United Kingdom' },
  EUR: { code: 'de', name: 'Germany' },
  SGD: { code: 'sg', name: 'Singapore' },
  AUD: { code: 'au', name: 'Australia' },
  CAD: { code: 'ca', name: 'Canada' },
  JPY: { code: 'jp', name: 'Japan' },
};

const schema = z.object({
  baseSalary: z.coerce.number().positive(),
  bonus: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  currency: z.string().length(3),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  changeReason: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

type SalaryRevisionDialogProps = {
  open: boolean;
  employeeId: string;
  current: SalaryRecord | null;
  defaultCurrency?: string;
  onClose: () => void;
  onSaved: () => void;
};

function CurrencyFlag({ currency }: { currency: string }) {
  const meta = CURRENCY_FLAG_COUNTRY[currency.toUpperCase()];
  if (!meta) return null;
  return (
    <Box
      component="img"
      src={`https://flagcdn.com/w80/${meta.code}.png`}
      srcSet={`https://flagcdn.com/w40/${meta.code}.png 1x, https://flagcdn.com/w80/${meta.code}.png 2x`}
      alt={`${meta.name} flag`}
      sx={{
        width: 22,
        height: 16,
        objectFit: 'cover',
        borderRadius: 0.5,
        boxShadow: '0 0 0 1px rgba(7,25,38,0.12)',
        flexShrink: 0,
      }}
    />
  );
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: alpha('#FFFFFF', 0.95),
  },
};

export function SalaryRevisionDialog({
  open,
  employeeId,
  current,
  defaultCurrency = 'USD',
  onClose,
  onSaved,
}: SalaryRevisionDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      baseSalary: 50000,
      bonus: 0,
      allowances: 0,
      deductions: 0,
      currency: defaultCurrency,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      changeReason: '',
    },
  });

  const watched = watch();
  const currencyOptions = useMemo(() => {
    const codes = new Set<string>(ACME_CURRENCIES);
    if (current?.currency) codes.add(current.currency.toUpperCase());
    if (defaultCurrency) codes.add(defaultCurrency.toUpperCase());
    return [...codes].sort();
  }, [current?.currency, defaultCurrency]);

  const preview = useMemo(() => {
    const base = Number(watched.baseSalary) || 0;
    const bonus = Number(watched.bonus) || 0;
    const allowances = Number(watched.allowances) || 0;
    const deductions = Number(watched.deductions) || 0;
    const gross = base + bonus + allowances;
    const net = gross - deductions;
    const currency = (watched.currency || defaultCurrency).toUpperCase();
    return { gross, net, currency };
  }, [watched, defaultCurrency]);

  useEffect(() => {
    if (!open) return;
    const today = new Date().toISOString().slice(0, 10);
    reset({
      baseSalary: current ? Number(current.baseSalary) : 50000,
      bonus: current ? Number(current.bonus) : 0,
      allowances: current ? Number(current.allowances) : 0,
      deductions: current ? Number(current.deductions) : 0,
      currency: (current?.currency ?? defaultCurrency).toUpperCase(),
      effectiveFrom: today,
      changeReason: '',
    });
    setError(null);
  }, [open, current, defaultCurrency, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await reviseSalary(employeeId, {
        ...values,
        currency: values.currency.toUpperCase(),
        changeReason: values.changeReason || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message ?? 'Salary revision failed');
      } else {
        setError('Salary revision failed');
      }
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <AcmeDialogHeader
        title={current ? 'Revise salary' : 'Create salary'}
        subtitle="Closes the open period and creates a new salary record in one transaction."
        icon={<PaymentsOutlinedIcon />}
        onClose={onClose}
      />
      <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, pb: 2 }}>
        <Stack component="form" id="salary-form" spacing={2} onSubmit={onSubmit}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              border: `1px solid ${alpha('#0B3D5C', 0.1)}`,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(238,244,248,0.88))',
            }}
          >
            <Typography
              variant="overline"
              color="secondary"
              sx={{ display: 'block', mb: 1.5, letterSpacing: '0.1em' }}
            >
              Compensation
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <TextField
                label="Base salary"
                type="number"
                fullWidth
                size="small"
                sx={fieldSx}
                error={Boolean(errors.baseSalary)}
                helperText={errors.baseSalary?.message}
                {...register('baseSalary')}
              />
              <TextField
                label="Bonus"
                type="number"
                fullWidth
                size="small"
                sx={fieldSx}
                {...register('bonus')}
              />
              <TextField
                label="Allowances"
                type="number"
                fullWidth
                size="small"
                sx={fieldSx}
                {...register('allowances')}
              />
              <TextField
                label="Deductions"
                type="number"
                fullWidth
                size="small"
                sx={fieldSx}
                {...register('deductions')}
              />
            </Box>
          </Box>

          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2.5,
              border: `1px solid ${alpha('#0B3D5C', 0.1)}`,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.96), rgba(238,244,248,0.88))',
            }}
          >
            <Typography
              variant="overline"
              color="secondary"
              sx={{ display: 'block', mb: 1.5, letterSpacing: '0.1em' }}
            >
              Timing & currency
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Currency"
                    fullWidth
                    size="small"
                    sx={fieldSx}
                    error={Boolean(errors.currency)}
                    helperText={errors.currency?.message}
                  >
                    {currencyOptions.map((code) => (
                      <MenuItem key={code} value={code}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <CurrencyFlag currency={code} />
                          <span>{code}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="Effective from"
                type="date"
                fullWidth
                size="small"
                sx={fieldSx}
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('effectiveFrom')}
              />
            </Box>
            <TextField
              label="Change reason"
              fullWidth
              size="small"
              multiline
              minRows={2}
              sx={{ ...fieldSx, mt: 1.5 }}
              placeholder="Optional note for the audit trail"
              {...register('changeReason')}
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 1.25,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: `1px solid ${alpha('#0B3D5C', 0.14)}`,
                background: `linear-gradient(145deg, ${alpha('#0B3D5C', 0.08)} 0%, rgba(255,255,255,0.94) 60%)`,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Gross preview
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5, color: 'primary.dark', fontWeight: 700 }}>
                {formatMoney(preview.gross, preview.currency)}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.75,
                borderRadius: 2.5,
                border: `1px solid ${alpha('#0F766E', 0.16)}`,
                background: `linear-gradient(145deg, ${alpha('#0F766E', 0.1)} 0%, rgba(255,255,255,0.94) 60%)`,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  Net preview
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <CurrencyFlag currency={preview.currency} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {preview.currency}
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="h6" sx={{ mt: 0.5, color: 'secondary.dark', fontWeight: 700 }}>
                {formatMoney(preview.net, preview.currency)}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" form="salary-form" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : current ? 'Save revision' : 'Save salary'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
