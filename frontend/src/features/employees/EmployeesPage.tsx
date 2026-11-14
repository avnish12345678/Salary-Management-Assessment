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
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
      sortBy: 'joiningDate' as const,
      sortOrder: 'desc' as const,
    }),
    [page, pageSize, search, departmentId, countryId, employmentStatus, designation],
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
        <Typography variant="h4">Employees</Typography>
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
          />
          <FormControl fullWidth size="small">
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
          <FormControl fullWidth size="small">
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
          <FormControl fullWidth size="small">
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
          <FormControl fullWidth size="small">
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
      </Paper>

      {actionError && <Alert severity="error">{actionError}</Alert>}
      {employeesQuery.isError && (
        <Alert severity="error">Failed to load employees. Check API connectivity.</Alert>
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
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main', whiteSpace: 'nowrap' }}>
                        {row.employeeCode}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.fullName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.email}</TableCell>
                      <TableCell>{row.department.name}</TableCell>
                      <TableCell>{row.designation}</TableCell>
                      <TableCell>{row.country.name}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.joiningDate)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.employmentStatus}
                          color={row.employmentStatus === 'ACTIVE' ? 'success' : 'default'}
                          variant={row.employmentStatus === 'ACTIVE' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {row.currentSalary
                          ? formatMoney(row.currentSalary.netSalary, row.currentSalary.currency)
                          : '—'}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="View">
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
                        {canWriteEmployees && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditing(row);
                                  setDialogOpen(true);
                                }}
                                sx={{
                                  color: 'secondary.main',
                                  bgcolor: alpha('#0F766E', 0.08),
                                  mr: 0.5,
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
                                sx={{
                                  color: 'text.secondary',
                                  bgcolor: alpha('#5B738B', 0.08),
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
