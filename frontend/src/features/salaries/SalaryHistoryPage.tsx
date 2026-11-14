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
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { fetchGlobalRevisions } from '../../services/salaries-service';
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

function ChangeChip({
  previous,
  current,
  currency,
}: {
  previous: string | null;
  current: string;
  currency: string;
}) {
  if (previous == null) {
    return (
      <Chip
        size="small"
        label="Initial"
        sx={{ fontWeight: 700, bgcolor: alpha('#1F5F84', 0.12), color: '#1F5F84' }}
      />
    );
  }
  const delta = Number(current) - Number(previous);
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

export function SalaryHistoryPage() {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [currency, setCurrency] = useState('');
  const [changeType, setChangeType] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const revisionsQuery = useQuery({
    queryKey: ['global-revisions', page, pageSize, search],
    queryFn: () =>
      fetchGlobalRevisions({
        page: page + 1,
        pageSize,
        search: search || undefined,
      }),
  });

  const rows = useMemo(() => {
    let items = revisionsQuery.data?.items ?? [];
    if (currency) {
      items = items.filter((row) => row.current.currency.toUpperCase() === currency);
    }
    if (changeType === 'increase') {
      items = items.filter(
        (row) => row.previous && Number(row.current.netSalary) > Number(row.previous.netSalary),
      );
    } else if (changeType === 'decrease') {
      items = items.filter(
        (row) => row.previous && Number(row.current.netSalary) < Number(row.previous.netSalary),
      );
    } else if (changeType === 'initial') {
      items = items.filter((row) => !row.previous);
    }
    return items;
  }, [revisionsQuery.data?.items, currency, changeType]);

  const total = revisionsQuery.data?.meta.total ?? 0;

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Salary History</Typography>

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
          <FormControl fullWidth size="small" sx={filterFieldSx}>
            <InputLabel>Change type</InputLabel>
            <Select
              label="Change type"
              value={changeType}
              onChange={(e) => {
                setPage(0);
                setChangeType(e.target.value);
              }}
            >
              <MenuItem value="">All changes</MenuItem>
              <MenuItem value="increase">Increase</MenuItem>
              <MenuItem value="decrease">Decrease</MenuItem>
              <MenuItem value="initial">Initial</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {revisionsQuery.isError && (
        <Alert severity="error">Failed to load salary history. Check API connectivity.</Alert>
      )}

      <Paper
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,250,252,0.94))',
        }}
      >
        {revisionsQuery.isLoading ? (
          <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No salary revisions match the current filters.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer className="acme-scroll" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell>Changed by</TableCell>
                    <TableCell>Currency</TableCell>
                    <TableCell>Previous net</TableCell>
                    <TableCell>New net</TableCell>
                    <TableCell>Change</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const employeeId = row.employee?.id ?? row.employeeId;
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatDate(row.createdAt)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                          {row.employee?.employeeCode ?? '—'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {row.employee?.fullName ?? '—'}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{row.changedBy.email}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <CurrencyFlag currency={row.current.currency} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.current.currency}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                          {row.previous
                            ? formatMoney(row.previous.netSalary, row.previous.currency)
                            : '—'}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: 'primary.dark' }}
                        >
                          {formatMoney(row.current.netSalary, row.current.currency)}
                        </TableCell>
                        <TableCell>
                          <ChangeChip
                            previous={row.previous?.netSalary ?? null}
                            current={row.current.netSalary}
                            currency={row.current.currency}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', maxWidth: 220 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.changeReason || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          {employeeId ? (
                            <Tooltip title="View employee">
                              <IconButton
                                component={RouterLink}
                                to={`/employees/${employeeId}`}
                                size="small"
                                sx={{
                                  color: 'primary.main',
                                  bgcolor: alpha('#0B3D5C', 0.06),
                                }}
                              >
                                <VisibilityOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            '—'
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
    </Stack>
  );
}
