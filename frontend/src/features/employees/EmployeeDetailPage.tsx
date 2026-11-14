import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
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
import type { SalaryRecord } from '../../types/api';

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

function SectionShell({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(238,244,248,0.92))',
        boxShadow: '0 12px 32px rgba(7, 25, 38, 0.05)',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

function ProfileFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
      <Box
        sx={{
          mt: 0.15,
          color: 'text.secondary',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function SalaryMetric({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        height: '100%',
        border: `1px solid ${alpha(accent, 0.16)}`,
        background: `linear-gradient(145deg, ${alpha(accent, 0.1)} 0%, rgba(255,255,255,0.92) 55%)`,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          mt: 0.75,
          fontSize: { xs: '1.2rem', md: '1.35rem' },
          lineHeight: 1.2,
          color: 'primary.dark',
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function moneyDelta(current: string, previous: string): number {
  return Number(current) - Number(previous);
}

function DeltaChip({ current, previous, currency }: { current: string; previous: string; currency: string }) {
  const delta = moneyDelta(current, previous);
  if (!Number.isFinite(delta) || delta === 0) {
    return (
      <Chip size="small" label="No change" sx={{ fontWeight: 600, bgcolor: alpha('#5B738B', 0.1) }} />
    );
  }
  const up = delta > 0;
  return (
    <Chip
      size="small"
      label={`${up ? '+' : '−'}${formatMoney(Math.abs(delta).toFixed(2), currency)}`}
      sx={{
        fontWeight: 700,
        bgcolor: alpha(up ? '#0F766E' : '#B42318', 0.12),
        color: up ? '#0F766E' : '#B42318',
      }}
    />
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={{
        py: 3.5,
        px: 2,
        borderRadius: 2.5,
        textAlign: 'center',
        bgcolor: alpha('#0B3D5C', 0.03),
        border: `1px dashed ${alpha('#0B3D5C', 0.16)}`,
      }}
    >
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </Box>
  );
}

export function EmployeeDetailPage() {
  const theme = useTheme();
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

  const employee = employeeQuery.data;
  const current = compareQuery.data?.current ?? employee?.currentSalary ?? null;
  const previous = compareQuery.data?.previous ?? null;
  const historyRows = historyQuery.data?.items ?? [];
  const revisionRows = revisionsQuery.data?.items ?? [];

  const initials = useMemo(() => {
    if (!employee) return '?';
    return `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  }, [employee]);

  const compareRows = useMemo(() => {
    if (!previous || !current) return [];
    return [
      ['Base', previous.baseSalary, current.baseSalary],
      ['Bonus', previous.bonus, current.bonus],
      ['Allowances', previous.allowances, current.allowances],
      ['Deductions', previous.deductions, current.deductions],
      ['Gross', previous.grossSalary, current.grossSalary],
      ['Net', previous.netSalary, current.netSalary],
    ] as const;
  }, [previous, current]);

  if (employeeQuery.isLoading) {
    return (
      <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (employeeQuery.isError || !employee) {
    return <Alert severity="error">Employee not found.</Alert>;
  }

  const isActive = employee.employmentStatus === 'ACTIVE';

  return (
    <Stack spacing={2.25}>
      <Paper
        sx={{
          p: { xs: 2, md: 2.75 },
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(232,241,247,0.95) 55%, rgba(222,239,236,0.88) 100%)',
          boxShadow: '0 14px 36px rgba(7, 25, 38, 0.06)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at top right, rgba(15,118,110,0.12), transparent 42%), radial-gradient(circle at left center, rgba(11,61,92,0.08), transparent 40%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2.5}
          sx={{ position: 'relative', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                fontSize: '1.45rem',
                fontWeight: 700,
                bgcolor: isActive ? 'secondary.main' : alpha('#5B738B', 0.7),
                color: '#fff',
                boxShadow: '0 10px 24px rgba(7,25,38,0.16)',
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                  }}
                >
                  {employee.employeeCode}
                </Typography>
                <Chip
                  size="small"
                  label={isActive ? 'Active' : 'Inactive'}
                  sx={{
                    fontWeight: 700,
                    height: 22,
                    bgcolor: alpha(isActive ? '#0F766E' : '#5B738B', 0.12),
                    color: isActive ? '#0F766E' : '#5B738B',
                  }}
                />
              </Stack>
              <Typography
                variant="h4"
                sx={{ fontSize: { xs: '1.7rem', md: '2rem' }, lineHeight: 1.15, wordBreak: 'break-word' }}
              >
                {employee.fullName}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                {employee.designation}
                {employee.manager ? ` · Reports to ${employee.manager.fullName}` : ''}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              component={RouterLink}
              to="/employees"
              variant="outlined"
              startIcon={<ArrowBackOutlinedIcon />}
            >
              Back to list
            </Button>
            {canWriteSalaries && (
              <Button
                variant="contained"
                startIcon={<PaidOutlinedIcon />}
                onClick={() => setRevisionOpen(true)}
              >
                {current ? 'Revise salary' : 'Add salary'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gap: 2.25,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1.15fr)' },
        }}
      >
        <SectionShell
          title="Profile"
          subtitle="Contact and employment details"
          icon={<PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} />}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <ProfileFact
              icon={<EmailOutlinedIcon sx={{ fontSize: 18 }} />}
              label="Email"
              value={employee.email}
            />
            <ProfileFact
              icon={<PhoneOutlinedIcon sx={{ fontSize: 18 }} />}
              label="Phone"
              value={employee.phone || '—'}
            />
            <ProfileFact
              icon={<BusinessOutlinedIcon sx={{ fontSize: 18 }} />}
              label="Department"
              value={employee.department.name}
            />
            <ProfileFact
              icon={<LocationOnOutlinedIcon sx={{ fontSize: 18 }} />}
              label="Location"
              value={`${employee.city}, ${employee.country.name}`}
            />
            <ProfileFact
              icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />}
              label="Joined"
              value={formatDate(employee.joiningDate)}
            />
            <ProfileFact
              icon={<PaidOutlinedIcon sx={{ fontSize: 18 }} />}
              label="Payroll currency"
              value={employee.country.currencyCode}
            />
          </Box>
        </SectionShell>

        <SectionShell
          title="Current salary"
          subtitle={current ? `Effective from ${formatDate(current.effectiveFrom)}` : 'No active package yet'}
          icon={<PaidOutlinedIcon sx={{ fontSize: 18 }} />}
          action={
            current ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CurrencyFlag currency={current.currency} />
                <Chip size="small" label={current.currency} sx={{ fontWeight: 700 }} />
              </Stack>
            ) : undefined
          }
        >
          {current ? (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                <SalaryMetric
                  label="Net pay"
                  value={formatMoney(current.netSalary, current.currency)}
                  accent="#0F766E"
                  hint="Take-home after deductions"
                />
                <SalaryMetric
                  label="Gross pay"
                  value={formatMoney(current.grossSalary, current.currency)}
                  accent="#0B3D5C"
                  hint="Before deductions"
                />
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.25,
                  gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                }}
              >
                {(
                  [
                    ['Base', current.baseSalary],
                    ['Bonus', current.bonus],
                    ['Allowances', current.allowances],
                    ['Deductions', current.deductions],
                  ] as const
                ).map(([label, amount]) => (
                  <Box
                    key={label}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha('#0B3D5C', 0.035),
                      border: `1px solid ${alpha('#0B3D5C', 0.08)}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, color: 'primary.dark' }}>
                      {formatMoney(amount, current.currency)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          ) : (
            <EmptyState message="No active salary record for this employee." />
          )}
        </SectionShell>
      </Box>

      <SectionShell
        title="Previous vs current"
        subtitle="Side-by-side package comparison"
        icon={<TrendingUpOutlinedIcon sx={{ fontSize: 18 }} />}
      >
        {!previous || !current ? (
          <EmptyState message="Not enough history to compare yet." />
        ) : !compareQuery.data?.sameCurrency ? (
          <Stack spacing={2}>
            <Alert severity="warning">
              Previous ({previous.currency}) and current ({current.currency}) use different currencies —
              amounts are shown separately and are not combined.
            </Alert>
            <CompareTable
              rows={compareRows}
              previous={previous}
              current={current}
              showDelta={false}
            />
          </Stack>
        ) : (
          <CompareTable rows={compareRows} previous={previous} current={current} showDelta />
        )}
      </SectionShell>

      <Box
        sx={{
          display: 'grid',
          gap: 2.25,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        <SectionShell
          title="Salary history"
          subtitle={`${historyRows.length} record${historyRows.length === 1 ? '' : 's'}`}
          icon={<HistoryOutlinedIcon sx={{ fontSize: 18 }} />}
        >
          {historyRows.length === 0 ? (
            <EmptyState message="No salary history available." />
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: `1px solid ${alpha('#0B3D5C', 0.08)}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Effective from</TableCell>
                    <TableCell>Effective to</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell align="right">Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{formatDate(row.effectiveFrom)}</TableCell>
                      <TableCell>{row.effectiveTo ? formatDate(row.effectiveTo) : 'Open'}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <CurrencyFlag currency={row.currency} />
                          <span>{row.currency}</span>
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                        {formatMoney(row.netSalary, row.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionShell>

        <SectionShell
          title="Revision audit trail"
          subtitle={`${revisionRows.length} change${revisionRows.length === 1 ? '' : 's'}`}
          icon={<HistoryOutlinedIcon sx={{ fontSize: 18 }} />}
        >
          {revisionRows.length === 0 ? (
            <EmptyState message="No revisions recorded yet." />
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: `1px solid ${alpha('#0B3D5C', 0.08)}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Changed by</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">New net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revisionRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 160 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.changedBy.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.changeReason || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                        {formatMoney(row.current.netSalary, row.current.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionShell>
      </Box>

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

function CompareTable({
  rows,
  previous,
  current,
  showDelta,
}: {
  rows: ReadonlyArray<readonly [string, string, string]>;
  previous: SalaryRecord;
  current: SalaryRecord;
  showDelta: boolean;
}) {
  return (
    <TableContainer sx={{ borderRadius: 2, border: `1px solid ${alpha('#0B3D5C', 0.08)}` }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Component</TableCell>
            <TableCell align="right">Previous</TableCell>
            <TableCell align="right">Current</TableCell>
            {showDelta && <TableCell align="right">Change</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([label, prev, curr]) => (
            <TableRow key={label} hover>
              <TableCell sx={{ fontWeight: label === 'Net' ? 700 : 600 }}>{label}</TableCell>
              <TableCell align="right">{formatMoney(prev, previous.currency)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                {formatMoney(curr, current.currency)}
              </TableCell>
              {showDelta && (
                <TableCell align="right">
                  <DeltaChip current={curr} previous={prev} currency={current.currency} />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
