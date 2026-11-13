import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchCountries, fetchDepartments } from '../../services/reference-service';
import { downloadSalaryReport, fetchSalaryReport } from '../../services/reports-service';
import { formatDate, formatMoney } from '../../utils/format';

export function ReportsPage() {
  const { can } = usePermissions();
  const canExport = can('reports:export');

  const [countryId, setCountryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [currency, setCurrency] = useState('');
  const [search, setSearch] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      countryId: countryId || undefined,
      departmentId: departmentId || undefined,
      employmentStatus: employmentStatus || undefined,
      currency: currency || undefined,
      search: search.trim() || undefined,
      minSalary: minSalary ? Number(minSalary) : undefined,
      maxSalary: maxSalary ? Number(maxSalary) : undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [
      countryId,
      departmentId,
      employmentStatus,
      currency,
      search,
      minSalary,
      maxSalary,
      fromDate,
      toDate,
    ],
  );

  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: fetchCountries });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const reportQuery = useQuery({
    queryKey: ['salary-report', filters],
    queryFn: () => fetchSalaryReport(filters),
  });

  const currencyOptions = useMemo(() => {
    const fromCountries = (countriesQuery.data ?? []).map((c) => c.currencyCode);
    return [...new Set(fromCountries)].sort();
  }, [countriesQuery.data]);

  const report = reportQuery.data;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4">Salary Reports</Typography>
          <Typography color="text.secondary">
            Answer payroll questions with currency-safe filters and exports.
          </Typography>
        </Box>
        {canExport && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={async () => {
                setExportError(null);
                try {
                  await downloadSalaryReport(filters, 'csv');
                } catch {
                  setExportError('CSV export failed or is not permitted for your role.');
                }
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={async () => {
                setExportError(null);
                try {
                  await downloadSalaryReport(filters, 'xlsx');
                } catch {
                  setExportError('Excel export failed or is not permitted for your role.');
                }
              }}
            >
              Export Excel
            </Button>
          </Stack>
        )}
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField
            label="Search employee"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Country</InputLabel>
            <Select label="Country" value={countryId} onChange={(e) => setCountryId(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {(countriesQuery.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {(departmentsQuery.data ?? []).map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Currency</InputLabel>
            <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {currencyOptions.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Min salary"
            type="number"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            sx={{ width: 140 }}
          />
          <TextField
            label="Max salary"
            type="number"
            value={maxSalary}
            onChange={(e) => setMaxSalary(e.target.value)}
            sx={{ width: 140 }}
          />
          <TextField
            label="From date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </Paper>

      {exportError && <Alert severity="error">{exportError}</Alert>}
      {!canExport && (
        <Alert severity="info">Your role can view reports but cannot export CSV/Excel.</Alert>
      )}

      {reportQuery.isLoading && (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      )}
      {reportQuery.isError && <Alert severity="error">Failed to load reports.</Alert>}

      {report && (
        <>
          <Alert severity="info">{report.notes.currencyPolicy}</Alert>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              1. Total payroll by country
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Country</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Total payroll</TableCell>
                  <TableCell>Average</TableCell>
                  <TableCell>Employees</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.answers.payrollByCountry.map((row) => (
                  <TableRow key={`${row.country}-${row.currency}`}>
                    <TableCell>{row.country}</TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{formatMoney(row.totalPayroll, row.currency)}</TableCell>
                    <TableCell>{formatMoney(row.averageSalary, row.currency)}</TableCell>
                    <TableCell>{row.employeeCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              2. Highest payroll department (per currency)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Currency</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Total payroll</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.answers.highestPayrollDepartmentByCurrency.map((row) => (
                  <TableRow key={row.currency}>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{formatMoney(row.totalPayroll, row.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              3. Average salary by department
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Average</TableCell>
                  <TableCell>Employees</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.answers.averageSalaryByDepartment.map((row) => (
                  <TableRow key={`${row.department}-${row.currency}`}>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{formatMoney(row.averageSalary, row.currency)}</TableCell>
                    <TableCell>{row.employeeCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              4. Top 10 highest-paid employees (per currency)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Gross</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Country</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.answers.topPaidEmployees.map((row) => (
                  <TableRow key={`${row.employeeId}-${row.currency}`}>
                    <TableCell>
                      {row.fullName}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.employeeCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{formatMoney(row.grossSalary, row.currency)}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.country}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              5. Employees in selected salary range
            </Typography>
            {report.answers.employeesInSalaryRangeByCurrency.length === 0 ? (
              <Typography color="text.secondary">No employees in range.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Currency</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Min</TableCell>
                    <TableCell>Max</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.answers.employeesInSalaryRangeByCurrency.map((row) => (
                    <TableRow key={row.currency}>
                      <TableCell>{row.currency}</TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell>{row.minSalary ?? '—'}</TableCell>
                      <TableCell>{row.maxSalary ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              6. Highest average salary country (per currency)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Currency</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Average</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.answers.highestAverageSalaryCountryByCurrency.map((row) => (
                  <TableRow key={row.currency}>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell>{row.country}</TableCell>
                    <TableCell>{formatMoney(row.averageSalary, row.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              7. Salary revisions this month
            </Typography>
            <Typography variant="h3">{report.answers.salaryRevisionsThisMonth}</Typography>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              8. Previous vs current salary
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Previous</TableCell>
                  <TableCell>Current</TableCell>
                  <TableCell>Delta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.answers.previousVsCurrentSalary.map((row) => (
                  <TableRow key={row.revisionId}>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell>
                      {row.fullName}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.employeeCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.previous
                        ? formatMoney(row.previous.grossSalary, row.previous.currency)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {formatMoney(row.current.grossSalary, row.current.currency)}
                    </TableCell>
                    <TableCell>
                      {row.difference.grossDelta && row.difference.currency
                        ? formatMoney(row.difference.grossDelta, row.difference.currency)
                        : row.difference.note || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Stack>
  );
}
