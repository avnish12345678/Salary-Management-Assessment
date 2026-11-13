import {
  Box,
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
import { fetchGlobalRevisions } from '../../services/salaries-service';
import { formatDate, formatMoney } from '../../utils/format';

export function SalaryHistoryPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

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

  const rows = revisionsQuery.data?.items ?? [];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">Salary History</Typography>
        <Typography color="text.secondary">
          Traceable salary revisions across employees, including who changed what and when.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <TextField
          label="Search by employee name, email, or code"
          fullWidth
          value={searchInput}
          onChange={(e) => {
            setPage(0);
            setSearchInput(e.target.value);
          }}
        />
      </Paper>

      <Paper>
        {revisionsQuery.isLoading ? (
          <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No salary revisions found.</Typography>
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Changed by</TableCell>
                  <TableCell>Previous net</TableCell>
                  <TableCell>New net</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell>
                      <Typography
                        component={RouterLink}
                        to={`/employees/${row.employee?.id}`}
                        sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {row.employee?.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.employee?.employeeCode}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.changedBy.email}</TableCell>
                    <TableCell>
                      {row.previous
                        ? formatMoney(row.previous.netSalary, row.previous.currency)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {formatMoney(row.current.netSalary, row.current.currency)}
                    </TableCell>
                    <TableCell>{row.changeReason || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={revisionsQuery.data?.meta.total ?? 0}
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
    </Stack>
  );
}
