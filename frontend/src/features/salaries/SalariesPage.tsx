import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchEmployees } from '../../services/employees-service';
import { formatDate, formatMoney } from '../../utils/format';
import { SalaryRevisionDialog } from './SalaryRevisionDialog';
import type { Employee } from '../../types/api';

export function SalariesPage() {
  const { canWriteSalaries } = usePermissions();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const employeesQuery = useQuery({
    queryKey: ['salaries-employees', page, pageSize, search],
    queryFn: () =>
      fetchEmployees({
        page: page + 1,
        pageSize,
        search: search || undefined,
        sortBy: 'name',
        sortOrder: 'asc',
      }),
  });

  const rows = employeesQuery.data?.items ?? [];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">Salary Management</Typography>
        <Typography color="text.secondary">
          Review current compensation and create auditable salary revisions.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <TextField
          label="Search employees"
          fullWidth
          value={searchInput}
          onChange={(e) => {
            setPage(0);
            setSearchInput(e.target.value);
          }}
        />
      </Paper>

      {!canWriteSalaries && (
        <Alert severity="info">Your role can view salaries but cannot create revisions.</Alert>
      )}

      <Paper>
        {employeesQuery.isLoading ? (
          <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Net salary</TableCell>
                  <TableCell>Effective from</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      {row.fullName}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.employeeCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.department.name}</TableCell>
                    <TableCell>{row.currentSalary?.currency ?? '—'}</TableCell>
                    <TableCell>
                      {row.currentSalary
                        ? formatMoney(row.currentSalary.netSalary, row.currentSalary.currency)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {row.currentSalary ? formatDate(row.currentSalary.effectiveFrom) : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/employees/${row.id}`}
                        sx={{ mr: 1 }}
                      >
                        Details
                      </Button>
                      {canWriteSalaries && (
                        <Button size="small" variant="outlined" onClick={() => setSelected(row)}>
                          Revise
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={employeesQuery.data?.meta.total ?? 0}
              page={page}
              onPageChange={(_e, next) => setPage(next)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {selected && (
        <SalaryRevisionDialog
          open={Boolean(selected)}
          employeeId={selected.id}
          current={selected.currentSalary}
          defaultCurrency={selected.country.currencyCode}
          onClose={() => setSelected(null)}
          onSaved={() => {
            void employeesQuery.refetch();
          }}
        />
      )}
    </Stack>
  );
}
