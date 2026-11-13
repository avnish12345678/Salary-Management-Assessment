import {
  Alert,
  Box,
  Button,
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
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchEmployees, setEmployeeStatus } from '../../services/employees-service';
import { fetchCountries, fetchDepartments, fetchDesignations } from '../../services/reference-service';
import { formatDate, formatMoney } from '../../utils/format';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import type { Employee } from '../../types/api';

export function EmployeesPage() {
  const { canWriteEmployees } = usePermissions();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [countryId, setCountryId] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [designation, setDesignation] = useState('');
  const [sortBy, setSortBy] = useState<'joiningDate' | 'name' | 'employeeCode'>('joiningDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
      designation: designation || undefined,
      sortBy,
      sortOrder,
    }),
    [
      page,
      pageSize,
      search,
      departmentId,
      countryId,
      employmentStatus,
      designation,
      sortBy,
      sortOrder,
    ],
  );

  const departmentsQuery = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const countriesQuery = useQuery({ queryKey: ['countries'], queryFn: fetchCountries });
  const designationsQuery = useQuery({ queryKey: ['designations'], queryFn: fetchDesignations });
  const employeesQuery = useQuery({
    queryKey: ['employees', filters],
    queryFn: () => fetchEmployees(filters),
  });

  const rows = employeesQuery.data?.items ?? [];
  const total = employeesQuery.data?.meta.total ?? 0;

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4">Employees</Typography>
          <Typography color="text.secondary">
            Server-side search, filters, and pagination across the ACME workforce.
          </Typography>
        </Box>
        {canWriteEmployees && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            Add employee
          </Button>
        )}
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            label="Search name, email, or code"
            value={searchInput}
            onChange={(e) => {
              setPage(0);
              setSearchInput(e.target.value);
            }}
            fullWidth
          />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => {
                setPage(0);
                setDepartmentId(e.target.value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {(departmentsQuery.data ?? []).map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Country</InputLabel>
            <Select
              label="Country"
              value={countryId}
              onChange={(e) => {
                setPage(0);
                setCountryId(e.target.value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {(countriesQuery.data ?? []).map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={employmentStatus}
              onChange={(e) => {
                setPage(0);
                setEmploymentStatus(e.target.value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Designation</InputLabel>
            <Select
              label="Designation"
              value={designation}
              onChange={(e) => {
                setPage(0);
                setDesignation(e.target.value);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {(designationsQuery.data ?? []).map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <MenuItem value="joiningDate">Joining date</MenuItem>
              <MenuItem value="name">Employee name</MenuItem>
              <MenuItem value="employeeCode">Employee code</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>Order</InputLabel>
            <Select
              label="Order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {actionError && <Alert severity="error">{actionError}</Alert>}
      {employeesQuery.isError && (
        <Alert severity="error">Failed to load employees. Check API connectivity.</Alert>
      )}

      <Paper>
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
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Joining Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current Salary</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.employeeCode}</TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.department.name}</TableCell>
                    <TableCell>{row.designation}</TableCell>
                    <TableCell>{row.country.name}</TableCell>
                    <TableCell>{formatDate(row.joiningDate)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.employmentStatus}
                        color={row.employmentStatus === 'ACTIVE' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {row.currentSalary
                        ? formatMoney(row.currentSalary.netSalary, row.currentSalary.currency)
                        : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton component={RouterLink} to={`/employees/${row.id}`} size="small">
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canWriteEmployees && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditing(row);
                                setDialogOpen(true);
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              row.employmentStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={async () => {
                                setActionError(null);
                                try {
                                  await setEmployeeStatus(
                                    row.id,
                                    row.employmentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                                  );
                                  await employeesQuery.refetch();
                                } catch {
                                  setActionError('Failed to update employment status');
                                }
                              }}
                            >
                              {row.employmentStatus === 'ACTIVE' ? (
                                <ToggleOffOutlinedIcon fontSize="small" />
                              ) : (
                                <ToggleOnOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

      <EmployeeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          void employeesQuery.refetch();
          void designationsQuery.refetch();
        }}
        employee={editing}
        departments={departmentsQuery.data ?? []}
        countries={countriesQuery.data ?? []}
      />
    </Stack>
  );
}
