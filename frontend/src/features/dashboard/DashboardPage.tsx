import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip as MuiTooltip,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchDashboardAnalytics } from '../../services/dashboard-service';
import { fetchCountries, fetchDepartments } from '../../services/reference-service';
import { formatCompactNumber, formatMoney } from '../../utils/format';

const CHART_COLORS = ['#0B3D5C', '#0F766E', '#1F5F84', '#14B8A6', '#486581', '#334E68', '#0A5C56', '#5B738B'];

/** Primary country for each payroll currency in the ACME seed set */
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
        width: 28,
        height: 20,
        objectFit: 'cover',
        borderRadius: 0.75,
        boxShadow: '0 0 0 1px rgba(7,25,38,0.12)',
        flexShrink: 0,
      }}
    />
  );
}

function KpiIconBadge({ icon: Icon, color }: { icon: SvgIconComponent; color: string }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        bgcolor: alpha(color, 0.12),
        color,
        border: `1px solid ${alpha(color, 0.18)}`,
      }}
    >
      <Icon sx={{ fontSize: 20 }} />
    </Box>
  );
}

const TREND_OPTIONS = [
  {
    id: 'countryPayroll',
    label: 'Country-wise payroll',
    info: 'Total open annual payroll by country and currency. Each bar is a single currency total — values are never summed across currencies.',
  },
  {
    id: 'departmentPayroll',
    label: 'Department-wise payroll',
    info: 'Open annual payroll broken down by department within each currency. Compare department spend without mixing currencies.',
  },
  {
    id: 'departmentAverage',
    label: 'Department average salary',
    info: 'Average annual salary by department and currency (total payroll ÷ employee count in that group).',
  },
  {
    id: 'employeesByCountry',
    label: 'Employees by country',
    info: 'Employee headcount by country for the current filters. Useful for workforce distribution, not payroll totals.',
  },
  {
    id: 'salaryHistogram',
    label: 'Salary distribution',
    info: 'How many employees fall into each salary range bucket, grouped by currency. Hover bars for exact counts.',
  },
  {
    id: 'monthlyRevisions',
    label: 'Monthly salary revisions',
    info: 'Count of salary revision events by month. Shows compensation change activity, not payroll amounts.',
  },
] as const;

type TrendId = (typeof TREND_OPTIONS)[number]['id'];

function PageHeader({ title }: { title: string }) {
  return (
    <Box className="acme-fade-up">
      <Typography variant="overline" color="secondary" sx={{ display: 'block', mb: 0.5 }}>
        Workforce analytics
      </Typography>
      <Typography variant="h4">{title}</Typography>
    </Box>
  );
}

function CardInfoIcon({ title }: { title: string }) {
  return (
    <MuiTooltip
      title={title}
      arrow
      enterTouchDelay={0}
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            maxWidth: 280,
            bgcolor: '#102A43',
            fontSize: 12,
            lineHeight: 1.45,
            px: 1.25,
            py: 1,
          },
        },
        arrow: { sx: { color: '#102A43' } },
      }}
    >
      <IconButton
        size="small"
        aria-label="Card information"
        sx={{
          p: 0.35,
          color: 'text.secondary',
          '&:hover': { color: 'primary.main', bgcolor: alpha('#0B3D5C', 0.06) },
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </MuiTooltip>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
  info,
  endAdornment,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  info?: string;
  endAdornment?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Paper
      className="acme-fade-up"
      sx={{
        height: '100%',
        p: 2.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 16px 36px rgba(7, 25, 38, 0.08)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(145deg, ${alpha(accent ?? theme.palette.secondary.main, 0.1)} 0%, transparent 55%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ position: 'relative', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            {label}
          </Typography>
          {info && <CardInfoIcon title={info} />}
        </Stack>
        {endAdornment}
      </Stack>
      <Typography
        variant="h4"
        sx={{
          position: 'relative',
          mt: 1.25,
          fontSize: { xs: '1.55rem', md: '1.85rem' },
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ position: 'relative', display: 'block', mt: 1.25, lineHeight: 1.45 }}
        >
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'text.secondary',
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

function ChartPanel({
  title,
  info,
  action,
  children,
  empty,
}: {
  title: string;
  info?: string;
  action?: ReactNode;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <Paper
      className="acme-fade-up acme-fade-up-delay-2"
      sx={{
        p: { xs: 2, md: 2.75 },
        height: { xs: 420, md: 460 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{
          mb: 1.75,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontSize: '1.05rem' }}>
            {title}
          </Typography>
          {info && <CardInfoIcon title={info} />}
        </Stack>
        {action}
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {empty ? (
          <Box
            sx={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 2,
              bgcolor: alpha('#0B3D5C', 0.03),
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography color="text.secondary" variant="body2">
              No data for the current filters
            </Typography>
          </Box>
        ) : (
          children
        )}
      </Box>
    </Paper>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; name?: string; payload?: Record<string, unknown> }>;
  label?: string;
  valueFormatter?: (value: number, row?: Record<string, unknown>) => string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const numeric = Number(row.value ?? 0);
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 12px 28px rgba(7,25,38,0.12)',
        minWidth: 160,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label ?? String(row.payload?.label ?? row.name ?? '')}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {valueFormatter ? valueFormatter(numeric, row.payload) : formatCompactNumber(numeric)}
      </Typography>
    </Box>
  );
}

export function DashboardPage() {
  const theme = useTheme();
  const [countryId, setCountryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [currency, setCurrency] = useState('');
  const [selectedTrend, setSelectedTrend] = useState<TrendId>('countryPayroll');

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

  const countryPayroll = useMemo(
    () =>
      (data?.charts.countryPayroll ?? []).map((d) => ({
        ...d,
        total: Number(d.totalPayroll),
        label: d.country,
        short: `${d.countryCode} · ${d.currency}`,
      })),
    [data],
  );

  const departmentPayroll = useMemo(
    () =>
      (data?.charts.departmentPayroll ?? []).map((d) => ({
        ...d,
        total: Number(d.totalPayroll),
        label: d.department,
        short: `${d.departmentCode} · ${d.currency}`,
      })),
    [data],
  );

  const departmentAverage = useMemo(
    () =>
      (data?.charts.departmentAverageSalary ?? []).map((d) => ({
        ...d,
        avg: Number(d.averageSalary),
        label: d.department,
        short: `${d.departmentCode} · ${d.currency}`,
      })),
    [data],
  );

  const salaryHistogram = useMemo(
    () =>
      (data?.charts.salaryHistogram ?? []).map((d) => ({
        ...d,
        label: `${d.currency} ${d.bucket}`,
        shortLabel: d.bucket,
      })),
    [data],
  );

  const selectedTrendMeta = TREND_OPTIONS.find((option) => option.id === selectedTrend) ?? TREND_OPTIONS[0];

  const trendEmpty = useMemo(() => {
    switch (selectedTrend) {
      case 'countryPayroll':
        return countryPayroll.length === 0;
      case 'departmentPayroll':
        return departmentPayroll.length === 0;
      case 'departmentAverage':
        return departmentAverage.length === 0;
      case 'employeesByCountry':
        return (data?.charts.employeesByCountry ?? []).length === 0;
      case 'salaryHistogram':
        return salaryHistogram.length === 0;
      case 'monthlyRevisions':
        return (data?.charts.monthlyRevisionTrends ?? []).length === 0;
      default:
        return true;
    }
  }, [
    selectedTrend,
    countryPayroll,
    departmentPayroll,
    departmentAverage,
    salaryHistogram,
    data,
  ]);

  const renderSelectedTrend = () => {
    switch (selectedTrend) {
      case 'countryPayroll':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={countryPayroll} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={alpha(theme.palette.text.primary, 0.08)}
              />
              <XAxis
                type="number"
                tickFormatter={formatCompactNumber}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="short"
                width={88}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(value, row) => formatMoney(value, String(row?.currency ?? 'USD'))}
                  />
                }
              />
              <Bar dataKey="total" name="Payroll" radius={[0, 8, 8, 0]} barSize={18}>
                {countryPayroll.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'departmentPayroll':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={departmentPayroll.slice(0, 12)}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={alpha(theme.palette.text.primary, 0.08)}
              />
              <XAxis
                type="number"
                tickFormatter={formatCompactNumber}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="short"
                width={120}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(value, row) => formatMoney(value, String(row?.currency ?? 'USD'))}
                  />
                }
              />
              <Bar
                dataKey="total"
                name="Payroll"
                fill={theme.palette.secondary.main}
                radius={[0, 8, 8, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'departmentAverage':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={departmentAverage.slice(0, 12)}
              margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={alpha(theme.palette.text.primary, 0.08)}
              />
              <XAxis
                type="number"
                tickFormatter={formatCompactNumber}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="short"
                width={120}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(value, row) => formatMoney(value, String(row?.currency ?? 'USD'))}
                  />
                }
              />
              <Bar dataKey="avg" name="Average" fill="#1F5F84" radius={[0, 8, 8, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'employeesByCountry':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.charts.employeesByCountry ?? []}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={alpha(theme.palette.text.primary, 0.08)}
              />
              <XAxis
                dataKey="countryCode"
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={formatCompactNumber}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v.toLocaleString()} employees`} />} />
              <Bar dataKey="count" name="Employees" radius={[8, 8, 0, 0]} barSize={28}>
                {(data?.charts.employeesByCountry ?? []).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'salaryHistogram':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salaryHistogram} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={alpha(theme.palette.text.primary, 0.08)}
              />
              <XAxis
                dataKey="shortLabel"
                interval="preserveStartEnd"
                minTickGap={24}
                tick={{ fill: theme.palette.text.secondary, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={formatCompactNumber}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(v, row) =>
                      `${v.toLocaleString()} employees · ${String(row?.label ?? '')}`
                    }
                  />
                }
              />
              <Bar dataKey="count" name="Employees" fill="#334E68" radius={[6, 6, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'monthlyRevisions':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data?.charts.monthlyRevisionTrends ?? []}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={alpha(theme.palette.text.primary, 0.08)}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={formatCompactNumber}
                tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v.toLocaleString()} revisions`} />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={theme.palette.secondary.main}
                strokeWidth={2.75}
                dot={{ r: 3.5, fill: theme.palette.secondary.main, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Stack spacing={3.5} sx={{ width: '100%', maxWidth: '100%' }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2.5}
        sx={{
          width: '100%',
          alignItems: { xs: 'stretch', lg: 'flex-end' },
          justifyContent: 'space-between',
        }}
      >
        <PageHeader title="HR Salary Intelligence" />
        <Paper
          className="acme-fade-up acme-fade-up-delay-1"
          sx={{
            p: 1.5,
            width: { xs: '100%', lg: 'min(720px, 52%)' },
            flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(238,244,248,0.9))',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: '100%' }}>
            <FormControl sx={{ minWidth: 0, flex: 1 }} size="small">
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
            <FormControl sx={{ minWidth: 0, flex: 1 }} size="small">
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
            <FormControl sx={{ minWidth: 0, flex: 1 }} size="small">
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
            <FormControl sx={{ minWidth: 0, flex: 1 }} size="small">
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
      </Stack>

      {analyticsQuery.isLoading && (
        <Box sx={{ p: 10, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {analyticsQuery.isError && <Alert severity="error">Failed to load dashboard analytics.</Alert>}

      {data && (
        <>
          <Box>
            <SectionLabel>Workforce snapshot</SectionLabel>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  label="Total Employees"
                  value={data.kpis.totalEmployees.toLocaleString()}
                  accent={theme.palette.primary.main}
                  info={`Total employees matching the current filters: ${data.kpis.totalEmployees.toLocaleString()}. Includes both active and inactive staff.`}
                  endAdornment={<KpiIconBadge icon={GroupsOutlinedIcon} color={theme.palette.primary.main} />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  label="Active Employees"
                  value={data.kpis.activeEmployees.toLocaleString()}
                  accent={theme.palette.secondary.main}
                  info={`Active employees currently on payroll: ${data.kpis.activeEmployees.toLocaleString()} of ${data.kpis.totalEmployees.toLocaleString()} total.`}
                  endAdornment={<KpiIconBadge icon={HowToRegOutlinedIcon} color={theme.palette.secondary.main} />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  label="Departments"
                  value={String(data.kpis.totalDepartments)}
                  accent="#1F5F84"
                  info={`Active departments in ACME: ${data.kpis.totalDepartments}. Used for org structure and payroll breakdowns.`}
                  endAdornment={<KpiIconBadge icon={AccountTreeOutlinedIcon} color="#1F5F84" />}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <KpiCard
                  label="Countries Covered"
                  value={String(data.kpis.countriesCovered)}
                  accent="#334E68"
                  info={`Distinct countries represented by employees in the current filter set: ${data.kpis.countriesCovered}.`}
                  endAdornment={<KpiIconBadge icon={PublicOutlinedIcon} color="#334E68" />}
                />
              </Grid>
            </Grid>
          </Box>

          <Box>
            <SectionLabel>Annual payroll by currency</SectionLabel>
            <Grid container spacing={2}>
              {data.kpis.payrollByCurrency.map((item, index) => {
                const countryName = CURRENCY_FLAG_COUNTRY[item.currency]?.name ?? item.currency;
                return (
                  <Grid key={item.currency} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <KpiCard
                      label={item.currency}
                      value={formatCompactNumber(item.totalAnnualPayroll)}
                      hint={`${formatMoney(item.totalAnnualPayroll, item.currency)} · Avg ${formatMoney(item.averageAnnualSalary, item.currency)} · ${item.employeeCount.toLocaleString()} people`}
                      accent={CHART_COLORS[index % CHART_COLORS.length]}
                      endAdornment={<CurrencyFlag currency={item.currency} />}
                      info={`${item.currency} payroll for ${countryName}. Total annual payroll ${formatMoney(item.totalAnnualPayroll, item.currency)} across ${item.employeeCount.toLocaleString()} employees (avg ${formatMoney(item.averageAnnualSalary, item.currency)}). Amounts are never mixed with other currencies.`}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <Box>
            <SectionLabel>Distribution & trends</SectionLabel>
            <ChartPanel
              title={selectedTrendMeta.label}
              info={selectedTrendMeta.info}
              empty={trendEmpty}
              action={
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 260 } }}>
                  <InputLabel id="trend-select-label">Trend</InputLabel>
                  <Select
                    labelId="trend-select-label"
                    label="Trend"
                    value={selectedTrend}
                    onChange={(e) => setSelectedTrend(e.target.value as TrendId)}
                  >
                    {TREND_OPTIONS.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              }
            >
              {renderSelectedTrend()}
            </ChartPanel>
          </Box>
        </>
      )}
    </Stack>
  );
}
