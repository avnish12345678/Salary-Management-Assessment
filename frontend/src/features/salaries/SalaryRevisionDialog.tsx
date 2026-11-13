import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { SalaryRecord } from '../../types/api';
import { reviseSalary } from '../../services/salaries-service';

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
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!open) return;
    const today = new Date().toISOString().slice(0, 10);
    reset({
      baseSalary: current ? Number(current.baseSalary) : 50000,
      bonus: current ? Number(current.bonus) : 0,
      allowances: current ? Number(current.allowances) : 0,
      deductions: current ? Number(current.deductions) : 0,
      currency: current?.currency ?? defaultCurrency,
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
      <DialogTitle>{current ? 'Revise salary' : 'Create salary'}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Historical records are preserved. The current open period is closed and a new record is
          created in one transaction.
        </Typography>
        <Stack component="form" id="salary-form" spacing={2} onSubmit={onSubmit}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Base salary"
            type="number"
            fullWidth
            error={Boolean(errors.baseSalary)}
            helperText={errors.baseSalary?.message}
            {...register('baseSalary')}
          />
          <TextField label="Bonus" type="number" fullWidth {...register('bonus')} />
          <TextField label="Allowances" type="number" fullWidth {...register('allowances')} />
          <TextField label="Deductions" type="number" fullWidth {...register('deductions')} />
          <TextField label="Currency" fullWidth {...register('currency')} />
          <TextField
            label="Effective from"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            {...register('effectiveFrom')}
          />
          <TextField
            label="Change reason"
            fullWidth
            multiline
            minRows={2}
            {...register('changeReason')}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="salary-form" variant="contained" disabled={isSubmitting}>
          Save revision
        </Button>
      </DialogActions>
    </Dialog>
  );
}
