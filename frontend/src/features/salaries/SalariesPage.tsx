import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchEmployees } from '../../services/employees-service';
import { fetchCountries, fetchDepartments } from '../../services/reference-service';
import { formatDate, formatMoney } from '../../utils/format';
import { SalaryRevisionDialog } from './SalaryRevisionDialog';
import type { Employee } from '../../types/api';

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

const ACME_CURRENCIES = ['AUD', 'CAD', 'EUR', 'GBP', 'INR', 'JPY', 'SGD', 'USD'] as const;

function CurrencyFlag({ currency }: { currency: string }) {
  const meta = CURRENCY_FLAG_COUNTRY[currency.toUpperCase()];
  if (!meta) return null;
  return (
    <Box
      component="img"
      src={`https://flagcdn.com/w80/${meta.code}.png`}
      srcSet={`https://flagcdn.com/w40/${meta.code}.png 1x, https://flagcdn.com/w80/${meta.code}.png 2x`}
      alt={`${meta.name} flag`}
      title={meta.name}
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

const filterFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: alpha('#FFFFFF', 0.92),
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

export function SalariesPage() {
  const theme = useTheme();
  const { canWriteSalaries } = usePermissions();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [currency, setCurrency] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      page: page + 1,
      pageSize,
      search: search || undefined,
      departmentId: departmentId || undefined,
      countryId: countryId || undefined,
      employmentStatus: employmentStatus || undefined,
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, departmentId, countryId, employmentStatus],
  );

  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: fetchCountries });
  const employeesQuery = useQuery({
    queryKey: ['salaries-employees', filters],
    queryFn: () => fetchEmployees(filters),
  });

  const rows = useMemo(() => {
    const items = employeesQuery.data?.items ?? [];
    if (!currency) return items;
    return items.filter(
      (row) => (row.currentSalary?.currency ?? row.country.currencyCode).toUpperCase() === currency,
    );
  }, [employeesQuery.data?.items, currency]);

  const total = employeesQuery.data?.meta.total ?? 0;

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Salary Management</Typography>

      <Paper
        sx={{
          p: { xs: 1.75, md: 2 },
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(238,244,248,0.92))',
          boxShadow: '0 12px 32px rgba(7, 25, 38, 0.05)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ width: '100%', '& > *': { flex: 1, minWidth: 0 } }}
        >
          <TextField
            label="Search name, email, or code"
            value={searchInput}
            onChange={(e) => {
              setPage(0);
              setSearchInput(e.target.value);
            }}
            fullWidth
            size="small"
            sx={filterFieldSx}
          />
          <FormControl fullWidth size="small" sx={filterFieldSx}>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => {
                setPage(0);
                setDepartmentId(e.target.value);
              }}
            >
              <MenuItem value="">All departments</MenuItem>
              {(departmentsQuery.data ?? []).map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={filterFieldSx}>
            <InputLabel>Country</InputLabel>
            <Select
              label="Country"
              value={countryId}
              onChange={(e) => {
                setPage(0);
                setCountryId(e.target.value);
              }}
            >
              <MenuItem value="">All countries</MenuItem>
              {(countriesQuery.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={filterFieldSx}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={employmentStatus}
              onChange={(e) => {
                setPage(0);
                setEmploymentStatus(e.target.value);
              }}
            >
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={filterFieldSx}>
            <InputLabel>Currency</InputLabel>
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => {
                setPage(0);
                setCurrency(e.target.value);
              }}
            >
              <MenuItem value="">All currencies</MenuItem>
              {ACME_CURRENCIES.map((code) => (
                <MenuItem key={code} value={code}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <CurrencyFlag currency={code} />
                    <span>{code}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {!canWriteSalaries && (
        <Alert severity="info">Your role can view salaries but cannot create revisions.</Alert>
      )}
      {employeesQuery.isError && (
        <Alert severity="error">Failed to load salary records. Check API connectivity.</Alert>
      )}

      <Paper
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,250,252,0.94))',
        }}
      >
        {employeesQuery.isLoading ? (
          <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No employees match the current filters.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer className="acme-scroll" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>Gross</TableCell>
                    <TableCell>Net salary</TableCell>
                    <TableCell>Effective from</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const salary = row.currentSalary;
                    const payCurrency = salary?.currency ?? row.country.currencyCode;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                          {row.employeeCode}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {row.fullName}
                        </TableCell>
                        <TableCell>{row.department.name}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.employmentStatus}
                            color={row.employmentStatus === 'ACTIVE' ? 'success' : 'default'}
                            variant={row.employmentStatus === 'ACTIVE' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            {salary ? <CurrencyFlag currency={payCurrency} /> : null}
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {salary ? payCurrency : '—'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          {salary ? formatMoney(salary.grossSalary, salary.currency) : '—'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: 'primary.dark' }}>
                          {salary ? formatMoney(salary.netSalary, salary.currency) : '—'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {salary ? formatDate(salary.effectiveFrom) : '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="View details">
                            <IconButton
                              component={RouterLink}
                              to={`/employees/${row.id}`}
                              size="small"
                              sx={{
                                color: 'primary.main',
                                bgcolor: alpha('#0B3D5C', 0.06),
                                mr: 0.5,
                              }}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canWriteSalaries && (
                            <Tooltip title={salary ? 'Revise salary' : 'Add salary'}>
                              <IconButton
                                size="small"
                                onClick={() => setSelected(row)}
                                sx={{
                                  color: 'secondary.main',
                                  bgcolor: alpha('#0F766E', 0.08),
                                }}
                              >
                                <PaidOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_e, next) => setPage(next)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50]}
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
