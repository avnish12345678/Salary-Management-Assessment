import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchEmployee } from '../../services/employees-service';
import {
  fetchSalaryCompare,
  fetchSalaryHistory,
  fetchSalaryRevisions,
} from '../../services/salaries-service';
import { formatDate, formatMoney } from '../../utils/format';
import { SalaryRevisionDialog } from '../salaries/SalaryRevisionDialog';

export function EmployeeDetailPage() {
  const { id = '' } = useParams();
  const { canWriteSalaries } = usePermissions();
  const [revisionOpen, setRevisionOpen] = useState(false);

  const employeeQuery = useQuery({
    queryKey: ['employee', id],
    queryFn: () => fetchEmployee(id),
    enabled: Boolean(id),
  });
  const historyQuery = useQuery({
    queryKey: ['salary-history', id],
    queryFn: () => fetchSalaryHistory(id),
    enabled: Boolean(id),
  });
  const revisionsQuery = useQuery({
    queryKey: ['salary-revisions', id],
    queryFn: () => fetchSalaryRevisions(id),
    enabled: Boolean(id),
  });
  const compareQuery = useQuery({
    queryKey: ['salary-compare', id],
    queryFn: () => fetchSalaryCompare(id),
    enabled: Boolean(id),
  });

  if (employeeQuery.isLoading) {
    return (
      <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (employeeQuery.isError || !employeeQuery.data) {
    return <Alert severity="error">Employee not found.</Alert>;
  }

  const employee = employeeQuery.data;
  const current = compareQuery.data?.current ?? employee.currentSalary;
  const previous = compareQuery.data?.previous ?? null;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4">{employee.fullName}</Typography>
          <Typography color="text.secondary">
            {employee.employeeCode} · {employee.designation}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/employees" variant="outlined">
            Back to list
          </Button>
          {canWriteSalaries && (
            <Button variant="contained" onClick={() => setRevisionOpen(true)}>
              {current ? 'Revise salary' : 'Add salary'}
            </Button>
          )}
        </Stack>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Profile
            </Typography>
            <Typography>Email: {employee.email}</Typography>
            <Typography>Phone: {employee.phone || '—'}</Typography>
            <Typography>Department: {employee.department.name}</Typography>
            <Typography>
              Location: {employee.city}, {employee.country.name}
            </Typography>
            <Typography>Joined: {formatDate(employee.joiningDate)}</Typography>
            <Chip
              sx={{ mt: 1 }}
              size="small"
              label={employee.employmentStatus}
              color={employee.employmentStatus === 'ACTIVE' ? 'success' : 'default'}
            />
          </Box>
          <Divider flexItem orientation="vertical" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Current salary
            </Typography>
            {current ? (
              <>
                <Typography>
                  Net: {formatMoney(current.netSalary, current.currency)} ({current.currency})
                </Typography>
                <Typography>
                  Gross: {formatMoney(current.grossSalary, current.currency)}
                </Typography>
                <Typography>
                  Base / Bonus / Allowances / Deductions:{' '}
                  {formatMoney(current.baseSalary, current.currency)} /{' '}
                  {formatMoney(current.bonus, current.currency)} /{' '}
                  {formatMoney(current.allowances, current.currency)} /{' '}
                  {formatMoney(current.deductions, current.currency)}
                </Typography>
                <Typography>Effective from: {formatDate(current.effectiveFrom)}</Typography>
              </>
            ) : (
              <Typography color="text.secondary">No active salary record.</Typography>
            )}
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Previous vs current
        </Typography>
        {!previous || !current ? (
          <Typography color="text.secondary">Not enough history to compare yet.</Typography>
        ) : !compareQuery.data?.sameCurrency ? (
          <Alert severity="warning">
            Previous ({previous.currency}) and current ({current.currency}) use different
            currencies — amounts are shown separately and are not combined.
          </Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Component</TableCell>
                <TableCell>Previous</TableCell>
                <TableCell>Current</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(
                [
                  ['Base', previous.baseSalary, current.baseSalary],
                  ['Bonus', previous.bonus, current.bonus],
                  ['Allowances', previous.allowances, current.allowances],
                  ['Deductions', previous.deductions, current.deductions],
                  ['Net', previous.netSalary, current.netSalary],
                ] as const
              ).map(([label, prev, curr]) => (
                <TableRow key={label}>
                  <TableCell>{label}</TableCell>
                  <TableCell>{formatMoney(prev, previous.currency)}</TableCell>
                  <TableCell>{formatMoney(curr, current.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Salary history
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Effective from</TableCell>
              <TableCell>Effective to</TableCell>
              <TableCell>Currency</TableCell>
              <TableCell>Net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(historyQuery.data?.items ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDate(row.effectiveFrom)}</TableCell>
                <TableCell>{row.effectiveTo ? formatDate(row.effectiveTo) : 'Open'}</TableCell>
                <TableCell>{row.currency}</TableCell>
                <TableCell>{formatMoney(row.netSalary, row.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Revision audit trail
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Changed by</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>New net</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(revisionsQuery.data?.items ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell>{row.changedBy.email}</TableCell>
                <TableCell>{row.changeReason || '—'}</TableCell>
                <TableCell>
                  {formatMoney(row.current.netSalary, row.current.currency)}
                </TableCell>
              </TableRow>
            ))}
            {(revisionsQuery.data?.items.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary">No revisions recorded yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <SalaryRevisionDialog
        open={revisionOpen}
        employeeId={employee.id}
        current={current}
        defaultCurrency={employee.country.currencyCode}
        onClose={() => setRevisionOpen(false)}
        onSaved={() => {
          void employeeQuery.refetch();
          void historyQuery.refetch();
          void revisionsQuery.refetch();
          void compareQuery.refetch();
        }}
      />
    </Stack>
  );
}
