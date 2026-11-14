import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
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
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { AcmeDialogHeader } from '../../components/AcmeDialogHeader';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchCountries } from '../../services/reference-service';
import {
  downloadSalaryReport,
  fetchSalaryReport,
  type SalaryReport,
} from '../../services/reports-service';
import { formatDate, formatMoney } from '../../utils/format';

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

type ReportCardId =
  | 'revisions'
  | 'payrollByCountry'
  | 'highestDept'
  | 'highestAvgCountry'
  | 'avgByDepartment'
  | 'topPaid'
  | 'salaryRange'
  | 'previousVsCurrent';

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

function EmptyBlock({ message }: { message: string }) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </Box>
  );
}

/** Scrollable popup grid with clear space between table content and scrollbar. */
function DialogDataGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${alpha('#0B3D5C', 0.1)}`,
        bgcolor: alpha('#FFFFFF', 0.9),
        overflow: 'hidden',
      }}
    >
      <TableContainer
        className="acme-scroll"
        sx={{
          maxHeight: 480,
          overflowY: 'auto',
          overflowX: 'auto',
          scrollbarGutter: 'stable',
          pr: 1.75,
          pl: 0.5,
          py: 0.5,
          '& .MuiTable-root': {
            borderCollapse: 'separate',
          },
          '& .MuiTableCell-root:last-of-type': {
            pr: 2,
          },
        }}
      >
        {children}
      </TableContainer>
    </Box>
  );
}

function ReportCard({
  title,
  subtitle,
  value,
  hint,
  icon: Icon,
  accent,
  onClick,
}: {
  title: string;
  subtitle: string;
  value: string;
  hint?: string;
  icon: SvgIconComponent;
  accent: string;
  onClick: () => void;
}) {
  return (
    <Paper
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        p: 2.25,
        borderRadius: 3,
        cursor: 'pointer',
        border: `1px solid ${alpha(accent, 0.18)}`,
        background: `linear-gradient(145deg, ${alpha(accent, 0.1)} 0%, rgba(255,255,255,0.96) 55%)`,
        boxShadow: '0 12px 28px rgba(7, 25, 38, 0.05)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 18px 36px rgba(7, 25, 38, 0.1)',
        },
        '&:focus-visible': {
          outline: `2px solid ${accent}`,
          outlineOffset: 2,
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(accent, 0.14),
                color: accent,
                border: `1px solid ${alpha(accent, 0.18)}`,
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.35 }}>
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <OpenInNewOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.4 }} />
        </Stack>
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: '1.45rem', md: '1.7rem' },
            lineHeight: 1.15,
            color: 'primary.dark',
          }}
        >
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {hint}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

export function ReportsPage() {
  const { can } = usePermissions();
  const canExport = can('reports:export');

  const [exportError, setExportError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<ReportCardId | null>(null);
  const [dialogCountryId, setDialogCountryId] = useState('');

  const filters = useMemo(() => ({}), []);

  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: fetchCountries });
  const reportQuery = useQuery({
    queryKey: ['salary-report', filters],
    queryFn: () => fetchSalaryReport(filters),
  });

  const countries = countriesQuery.data ?? [];

  const countryNameByCurrency = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of countries) {
      if (!map.has(c.currencyCode)) map.set(c.currencyCode, c.name);
    }
    return map;
  }, [countries]);

  const report = reportQuery.data;

  const openCard = (id: ReportCardId) => {
    setDialogCountryId('');
    setActiveCard(id);
  };

  const closeCard = () => setActiveCard(null);

  const selectedDialogCountry = countries.find((c) => c.id === dialogCountryId);

  const filterByDialogCountry = <T extends { currency?: string; country?: string }>(rows: T[]) => {
    if (!selectedDialogCountry) return rows;
    return rows.filter(
      (row) =>
        (row.country != null && row.country === selectedDialogCountry.name) ||
        (row.currency != null &&
          row.currency.toUpperCase() === selectedDialogCountry.currencyCode.toUpperCase()),
    );
  };

  const cardMeta: Record<
    ReportCardId,
    { title: string; subtitle: string; icon: SvgIconComponent; accent: string }
  > = {
    revisions: {
      title: 'Salary revisions',
      subtitle: 'Changes recorded this month',
      icon: HistoryOutlinedIcon,
      accent: '#0F766E',
    },
    payrollByCountry: {
      title: 'Payroll by country',
      subtitle: 'Total and average compensation',
      icon: PublicOutlinedIcon,
      accent: '#0B3D5C',
    },
    highestDept: {
      title: 'Highest payroll department',
      subtitle: 'Top department per currency',
      icon: BusinessOutlinedIcon,
      accent: '#1F5F84',
    },
    highestAvgCountry: {
      title: 'Highest average country',
      subtitle: 'Best average pay per currency',
      icon: TrendingUpOutlinedIcon,
      accent: '#0A5C56',
    },
    avgByDepartment: {
      title: 'Average by department',
      subtitle: 'Department averages by country',
      icon: GroupsOutlinedIcon,
      accent: '#486581',
    },
    topPaid: {
      title: 'Top paid employees',
      subtitle: 'Highest earners per currency',
      icon: PaidOutlinedIcon,
      accent: '#0F766E',
    },
    salaryRange: {
      title: 'Salary range matches',
      subtitle: 'Employees within min/max filters',
      icon: GroupsOutlinedIcon,
      accent: '#334E68',
    },
    previousVsCurrent: {
      title: 'Previous vs current',
      subtitle: 'Recent revision comparisons',
      icon: CompareArrowsOutlinedIcon,
      accent: '#1F5F84',
    },
  };

  const cardValues = (data: SalaryReport): Record<ReportCardId, { value: string; hint?: string }> => ({
    revisions: {
      value: String(data.answers.salaryRevisionsThisMonth),
      hint: `Generated ${formatDate(data.generatedAt)}`,
    },
    payrollByCountry: {
      value: `${data.answers.payrollByCountry.length}`,
      hint: 'Countries in current report scope',
    },
    highestDept: {
      value: `${data.answers.highestPayrollDepartmentByCurrency.length}`,
      hint: 'Currency scopes with a leading department',
    },
    highestAvgCountry: {
      value: `${data.answers.highestAverageSalaryCountryByCurrency.length}`,
      hint: 'Currency scopes with a leading country',
    },
    avgByDepartment: {
      value: `${data.answers.averageSalaryByDepartment.length}`,
      hint: 'Department × currency rows',
    },
    topPaid: {
      value: `${data.answers.topPaidEmployees.length}`,
      hint: data.notes.topPaidNote,
    },
    salaryRange: {
      value: `${data.answers.employeesInSalaryRangeByCurrency.length}`,
      hint: 'Currency buckets matching salary range',
    },
    previousVsCurrent: {
      value: `${data.answers.previousVsCurrentSalary.length}`,
      hint: 'Recent revision comparison rows',
    },
  });

  const showCountryFilter =
    activeCard === 'avgByDepartment' ||
    activeCard === 'topPaid' ||
    activeCard === 'payrollByCountry' ||
    activeCard === 'salaryRange';

  const renderDialogBody = (): ReactNode => {
    if (!report || !activeCard) return null;

    if (activeCard === 'revisions') {
      return (
        <Box
          sx={{
            p: 3,
            borderRadius: 2.5,
            border: `1px solid ${alpha('#0F766E', 0.16)}`,
            background: `linear-gradient(145deg, ${alpha('#0F766E', 0.1)} 0%, rgba(255,255,255,0.96) 60%)`,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            Revisions this month
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, color: 'secondary.dark' }}>
            {report.answers.salaryRevisionsThisMonth}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25 }}>
            Count of auditable salary revisions created in the current calendar month under the
            active filters.
          </Typography>
        </Box>
      );
    }

    if (activeCard === 'payrollByCountry') {
      const rows = filterByDialogCountry(report.answers.payrollByCountry);
      if (rows.length === 0) return <EmptyBlock message="No payroll totals for the selected country." />;
      return (
        <DialogDataGrid>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Country</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Total payroll</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell align="right">Employees</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.country}-${row.currency}`} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.country}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <CurrencyFlag currency={row.currency} />
                      <span>{row.currency}</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark', whiteSpace: 'nowrap' }}>
                    {formatMoney(row.totalPayroll, row.currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatMoney(row.averageSalary, row.currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {row.employeeCount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogDataGrid>
      );
    }

    if (activeCard === 'highestDept') {
      const rows = report.answers.highestPayrollDepartmentByCurrency;
      if (rows.length === 0) return <EmptyBlock message="No department payroll leaders yet." />;
      return (
        <DialogDataGrid>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="right">Total payroll</TableCell>
                <TableCell align="right">Employees</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.currency} hover>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <CurrencyFlag currency={row.currency} />
                      <span>{row.currency}</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.department}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark', whiteSpace: 'nowrap' }}>
                    {formatMoney(row.totalPayroll, row.currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {row.employeeCount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogDataGrid>
      );
    }

    if (activeCard === 'highestAvgCountry') {
      const rows = report.answers.highestAverageSalaryCountryByCurrency;
      if (rows.length === 0) return <EmptyBlock message="No country averages available." />;
      return (
        <DialogDataGrid>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell>Country</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell align="right">Employees</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.currency} hover>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <CurrencyFlag currency={row.currency} />
                      <span>{row.currency}</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.country}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark', whiteSpace: 'nowrap' }}>
                    {formatMoney(row.averageSalary, row.currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {row.employeeCount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogDataGrid>
      );
    }

    if (activeCard === 'avgByDepartment') {
      const rows = filterByDialogCountry(report.answers.averageSalaryByDepartment);
      if (rows.length === 0) {
        return <EmptyBlock message="No department averages for the selected country." />;
      }
      return (
        <DialogDataGrid>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell align="right">Employees</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.department}-${row.currency}`} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{row.department}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {countryNameByCurrency.get(row.currency) ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <CurrencyFlag currency={row.currency} />
                      <span>{row.currency}</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark', whiteSpace: 'nowrap' }}>
                    {formatMoney(row.averageSalary, row.currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {row.employeeCount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogDataGrid>
      );
    }

    if (activeCard === 'topPaid') {
      const rows = filterByDialogCountry(report.answers.topPaidEmployees);
      if (rows.length === 0) {
        return <EmptyBlock message="No top-paid employees for the selected country." />;
      }
      return (
        <DialogDataGrid>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee ID</TableCell>
                <TableCell>Employee Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Gross</TableCell>
                <TableCell align="right">Net</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.employeeId}-${row.currency}`} hover>
                  <TableCell sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                    {row.employeeCode}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.fullName}</TableCell>
                  <TableCell>{row.department}</TableCell>
                  <TableCell>{row.country}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <CurrencyFlag currency={row.currency} />
                      <span>{row.currency}</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatMoney(row.grossSalary, row.currency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark', whiteSpace: 'nowrap' }}>
                    {formatMoney(row.netSalary, row.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogDataGrid>
      );
    }

    if (activeCard === 'salaryRange') {
      const rows = filterByDialogCountry(report.answers.employeesInSalaryRangeByCurrency);
      if (rows.length === 0) return <EmptyBlock message="No employees in range." />;
      return (
        <DialogDataGrid>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Count</TableCell>
                <TableCell align="right">Min</TableCell>
                <TableCell align="right">Max</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.currency} hover>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <CurrencyFlag currency={row.currency} />
                      <span>{row.currency}</span>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {row.count.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {row.minSalary != null ? formatMoney(row.minSalary, row.currency) : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {row.maxSalary != null ? formatMoney(row.maxSalary, row.currency) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogDataGrid>
      );
    }

    const compareRows = report.answers.previousVsCurrentSalary;
    if (compareRows.length === 0) return <EmptyBlock message="No recent revision comparisons." />;
    return (
      <DialogDataGrid>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell align="right">Previous</TableCell>
              <TableCell align="right">Current</TableCell>
              <TableCell align="right">Delta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {compareRows.map((row) => (
              <TableRow key={row.revisionId} hover>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.employeeCode}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                  {row.previous
                    ? formatMoney(row.previous.grossSalary, row.previous.currency)
                    : '—'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.dark', whiteSpace: 'nowrap' }}>
                  {formatMoney(row.current.grossSalary, row.current.currency)}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {row.difference.grossDelta && row.difference.currency
                    ? formatMoney(row.difference.grossDelta, row.difference.currency)
                    : row.difference.note || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogDataGrid>
    );
  };

  const values = report ? cardValues(report) : null;
  const activeMeta = activeCard ? cardMeta[activeCard] : null;

  return (
    <Stack spacing={2.25}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Typography variant="h4">Salary Reports</Typography>
        {canExport && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
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
              startIcon={<DownloadOutlinedIcon />}
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

      {exportError && <Alert severity="error">{exportError}</Alert>}
      {!canExport && (
        <Alert severity="info">Your role can view reports but cannot export CSV/Excel.</Alert>
      )}
      {reportQuery.isError && <Alert severity="error">Failed to load reports.</Alert>}

      {reportQuery.isLoading && (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {report && values && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {(Object.keys(cardMeta) as ReportCardId[]).map((id) => (
            <ReportCard
              key={id}
              title={cardMeta[id].title}
              subtitle={cardMeta[id].subtitle}
              value={values[id].value}
              hint={values[id].hint}
              icon={cardMeta[id].icon}
              accent={cardMeta[id].accent}
              onClick={() => openCard(id)}
            />
          ))}
        </Box>
      )}

      <Dialog open={Boolean(activeCard)} onClose={closeCard} fullWidth maxWidth="md">
        {activeMeta && (() => {
          const ActiveIcon = activeMeta.icon;
          return (
            <AcmeDialogHeader
              title={activeMeta.title}
              subtitle={activeMeta.subtitle}
              icon={<ActiveIcon />}
              onClose={closeCard}
            />
          );
        })()}
        <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, pb: 1.5 }}>
          {showCountryFilter && (
            <FormControl
              size="small"
              sx={{ mb: 2, minWidth: { xs: '100%', sm: 240 }, ...filterFieldSx }}
            >
              <InputLabel>Country</InputLabel>
              <Select
                label="Country"
                value={dialogCountryId}
                onChange={(e) => setDialogCountryId(e.target.value)}
              >
                <MenuItem value="">All countries</MenuItem>
                {countries.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <CurrencyFlag currency={c.currencyCode} />
                      <span>{c.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {renderDialogBody()}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCard} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
