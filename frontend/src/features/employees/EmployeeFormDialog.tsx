import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Country, Department, Employee } from '../../types/api';
import { createEmployee, updateEmployee } from '../../services/employees-service';
import axios from 'axios';

const schema = z.object({
  employeeCode: z.string().min(3).max(32),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  departmentId: z.string().uuid(),
  designation: z.string().min(1),
  countryId: z.string().uuid(),
  city: z.string().min(1),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseSalary: z.coerce.number().positive().optional(),
  bonus: z.coerce.number().min(0).optional(),
  allowances: z.coerce.number().min(0).optional(),
  deductions: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  salaryEffectiveFrom: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type EmployeeFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee?: Employee | null;
  departments: Department[];
  countries: Country[];
};

export function EmployeeFormDialog({
  open,
  onClose,
  onSaved,
  employee,
  departments,
  countries,
}: EmployeeFormDialogProps) {
  const isEdit = Boolean(employee);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const countryId = watch('countryId');

  useEffect(() => {
    if (!open) return;
    if (employee) {
      reset({
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone ?? '',
        departmentId: employee.departmentId,
        designation: employee.designation,
        countryId: employee.countryId,
        city: employee.city,
        joiningDate: employee.joiningDate,
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      reset({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        departmentId: departments[0]?.id ?? '',
        designation: '',
        countryId: countries[0]?.id ?? '',
        city: '',
        joiningDate: today,
        baseSalary: 50000,
        bonus: 0,
        allowances: 0,
        deductions: 0,
        currency: countries[0]?.currencyCode ?? 'USD',
        salaryEffectiveFrom: today,
      });
    }
    setError(null);
  }, [open, employee, departments, countries, reset]);

  useEffect(() => {
    if (isEdit || !countryId) return;
    const country = countries.find((c) => c.id === countryId);
    if (country) setValue('currency', country.currencyCode);
  }, [countryId, countries, isEdit, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      if (isEdit && employee) {
        await updateEmployee(employee.id, {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          departmentId: values.departmentId,
          designation: values.designation,
          countryId: values.countryId,
          city: values.city,
          joiningDate: values.joiningDate,
        });
      } else {
        await createEmployee({
          employeeCode: values.employeeCode,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          departmentId: values.departmentId,
          designation: values.designation,
          countryId: values.countryId,
          city: values.city,
          joiningDate: values.joiningDate,
          employmentStatus: 'ACTIVE',
          initialSalary: {
            baseSalary: values.baseSalary ?? 0,
            bonus: values.bonus ?? 0,
            allowances: values.allowances ?? 0,
            deductions: values.deductions ?? 0,
            currency: (values.currency ?? 'USD').toUpperCase(),
            effectiveFrom: values.salaryEffectiveFrom ?? values.joiningDate,
          },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error?.message ?? 'Save failed');
      } else {
        setError('Save failed');
      }
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEdit ? 'Edit employee' : 'Add employee'}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="employee-form" onSubmit={onSubmit} spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Employee code"
                fullWidth
                disabled={isEdit}
                error={Boolean(errors.employeeCode)}
                helperText={errors.employeeCode?.message}
                {...register('employeeCode')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="First name"
                fullWidth
                error={Boolean(errors.firstName)}
                helperText={errors.firstName?.message}
                {...register('firstName')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Last name"
                fullWidth
                error={Boolean(errors.lastName)}
                helperText={errors.lastName?.message}
                {...register('lastName')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email"
                fullWidth
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register('email')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Phone" fullWidth {...register('phone')} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Department"
                fullWidth
                defaultValue=""
                error={Boolean(errors.departmentId)}
                helperText={errors.departmentId?.message}
                {...register('departmentId')}
              >
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Designation"
                fullWidth
                error={Boolean(errors.designation)}
                helperText={errors.designation?.message}
                {...register('designation')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Country"
                fullWidth
                defaultValue=""
                error={Boolean(errors.countryId)}
                helperText={errors.countryId?.message}
                {...register('countryId')}
              >
                {countries.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} ({c.currencyCode})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="City"
                fullWidth
                error={Boolean(errors.city)}
                helperText={errors.city?.message}
                {...register('city')}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Joining date"
                type="date"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                error={Boolean(errors.joiningDate)}
                helperText={errors.joiningDate?.message}
                {...register('joiningDate')}
              />
            </Grid>
            {!isEdit && (
              <>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Base salary"
                    type="number"
                    fullWidth
                    {...register('baseSalary')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Bonus" type="number" fullWidth {...register('bonus')} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Allowances"
                    type="number"
                    fullWidth
                    {...register('allowances')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Deductions"
                    type="number"
                    fullWidth
                    {...register('deductions')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField label="Currency" fullWidth {...register('currency')} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="Salary effective from"
                    type="date"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    {...register('salaryEffectiveFrom')}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="employee-form" variant="contained" disabled={isSubmitting}>
          {isEdit ? 'Save changes' : 'Create employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
