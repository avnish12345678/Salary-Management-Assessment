import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchDashboardAnalytics } from '../../services/dashboard-service';
import { fetchCountries, fetchDepartments } from '../../services/reference-service';
import { formatMoney } from '../../utils/format';

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [countryId, setCountryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [currency, setCurrency] = useState('');

  const filters = useMemo(
    () => ({
      countryId: countryId || undefined,
      departmentId: departmentId || undefined,
      employmentStatus: employmentStatus || undefined,
      currency: currency || undefined,
    }),
    [countryId, departmentId, employmentStatus, currency],
  );

  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: fetchCountries });
  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const analyticsQuery = useQuery({
    queryKey: ['dashboard-analytics', filters],
    queryFn: () => fetchDashboardAnalytics(filters),
  });

  const data = analyticsQuery.data;
  const currencyOptions = useMemo(() => {
    const fromCountries = (countriesQuery.data ?? []).map((c) => c.currencyCode);
    return [...new Set(fromCountries)].sort();
  }, [countriesQuery.data]);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">HR Salary Intelligence</Typography>
        <Typography color="text.secondary">
          Currency-safe payroll analytics for ACME&apos;s global workforce.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Country</InputLabel>
            <Select
              label="Country"
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {(countriesQuery.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }}>
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
          <FormControl sx={{ minWidth: 140 }}>
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
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Currency</InputLabel>
            <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <MenuItem value="">All (split)</MenuItem>
              {currencyOptions.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {analyticsQuery.isLoading && (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {analyticsQuery.isError && (
        <Alert severity="error">Failed to load dashboard analytics.</Alert>
      )}

      {data && (
        <>
          <Alert severity="info">{data.notes.currencyPolicy}</Alert>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KpiCard label="Total Employees" value={String(data.kpis.totalEmployees)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KpiCard label="Active Employees" value={String(data.kpis.activeEmployees)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KpiCard label="Departments" value={String(data.kpis.totalDepartments)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <KpiCard label="Countries Covered" value={String(data.kpis.countriesCovered)} />
            </Grid>
            {data.kpis.payrollByCurrency.map((item) => (
              <Grid key={item.currency} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <KpiCard
                  label={`Annual Payroll (${item.currency})`}
                  value={formatMoney(item.totalAnnualPayroll, item.currency)}
                  hint={`Avg ${formatMoney(item.averageAnnualSalary, item.currency)} · ${item.employeeCount} employees`}
                />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2, height: 360 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Country-wise payroll
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={data.charts.countryPayroll.map((d) => ({
                    ...d,
                    total: Number(d.totalPayroll),
                    name: `${d.country} (${d.currency})`,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Payroll" fill="#0B3D5C" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2, height: 360 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Department-wise payroll
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={data.charts.departmentPayroll.map((d) => ({
                      ...d,
                      total: Number(d.totalPayroll),
                      name: `${d.department} (${d.currency})`,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Payroll" fill="#0F766E" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2, height: 360 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Department average salary
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={data.charts.departmentAverageSalary.map((d) => ({
                      ...d,
                      avg: Number(d.averageSalary),
                      name: `${d.department} (${d.currency})`,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg" name="Average" fill="#1F5F84" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2, height: 360 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Employees by country
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={data.charts.employeesByCountry}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="countryCode" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Employees" fill="#486581" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2, height: 360 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Salary distribution histogram
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart
                    data={data.charts.salaryHistogram.map((d) => ({
                      ...d,
                      label: `${d.currency} ${d.bucket}`,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Employees" fill="#334E68" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2, height: 360 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Monthly salary revision trends
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={data.charts.monthlyRevisionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#0F766E" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}
