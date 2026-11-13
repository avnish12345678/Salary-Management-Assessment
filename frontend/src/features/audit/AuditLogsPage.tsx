import {
  Alert,
  Box,
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
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchAuditLogs } from '../../services/audit-service';
import { formatDate } from '../../utils/format';

export function AuditLogsPage() {
  const { can } = usePermissions();
  const canRead = can('audit:read');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const logsQuery = useQuery({
    queryKey: ['audit-logs', page, pageSize, entityType, action],
    queryFn: () =>
      fetchAuditLogs({
        page: page + 1,
        pageSize,
        entityType: entityType || undefined,
        action: action || undefined,
      }),
    enabled: canRead,
  });

  if (!canRead) {
    return (
      <Alert severity="warning">
        Your role does not have permission to view audit logs (`audit:read`).
      </Alert>
    );
  }

  const rows = logsQuery.data?.items ?? [];

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">Audit Logs</Typography>
        <Typography color="text.secondary">
          Traceable record of employee and salary mutations.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Entity type</InputLabel>
            <Select
              label="Entity type"
              value={entityType}
              onChange={(e) => {
                setPage(0);
                setEntityType(e.target.value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="employee">employee</MenuItem>
              <MenuItem value="salary_record">salary_record</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Action</InputLabel>
            <Select
              label="Action"
              value={action}
              onChange={(e) => {
                setPage(0);
                setAction(e.target.value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="EMPLOYEE_CREATE">EMPLOYEE_CREATE</MenuItem>
              <MenuItem value="EMPLOYEE_UPDATE">EMPLOYEE_UPDATE</MenuItem>
              <MenuItem value="EMPLOYEE_ACTIVATE">EMPLOYEE_ACTIVATE</MenuItem>
              <MenuItem value="EMPLOYEE_DEACTIVATE">EMPLOYEE_DEACTIVATE</MenuItem>
              <MenuItem value="SALARY_CREATE">SALARY_CREATE</MenuItem>
              <MenuItem value="SALARY_UPDATE">SALARY_UPDATE</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper>
        {logsQuery.isLoading ? (
          <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No audit events match these filters.</Typography>
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell>{row.actor?.email ?? 'system'}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>
                      {row.entityType}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {row.entityId}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.ipAddress ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={logsQuery.data?.meta.total ?? 0}
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
