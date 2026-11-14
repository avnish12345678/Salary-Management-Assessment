import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import HistoryEduOutlinedIcon from '@mui/icons-material/HistoryEduOutlined';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LanOutlinedIcon from '@mui/icons-material/LanOutlined';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AcmeDialogHeader } from '../../components/AcmeDialogHeader';
import { usePermissions } from '../../hooks/usePermissions';
import { fetchAuditLogs, type AuditLogItem } from '../../services/audit-service';
import { formatDateTime, formatRelativeTime } from '../../utils/format';

const ENTITY_OPTIONS = [
  { value: '', label: 'All entities' },
  { value: 'employee', label: 'Employee' },
  { value: 'salary_record', label: 'Salary record' },
] as const;

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'EMPLOYEE_CREATE', label: 'Employee created' },
  { value: 'EMPLOYEE_UPDATE', label: 'Employee updated' },
  { value: 'EMPLOYEE_ACTIVATE', label: 'Employee activated' },
  { value: 'EMPLOYEE_DEACTIVATE', label: 'Employee deactivated' },
  { value: 'SALARY_CREATE', label: 'Salary created' },
  { value: 'SALARY_UPDATE', label: 'Salary revised' },
] as const;

type ActionMeta = {
  label: string;
  color: string;
  icon: SvgIconComponent;
};

const ACTION_META: Record<string, ActionMeta> = {
  EMPLOYEE_CREATE: { label: 'Employee created', color: '#0F766E', icon: PersonAddAlt1OutlinedIcon },
  EMPLOYEE_UPDATE: { label: 'Employee updated', color: '#1F5F84', icon: EditOutlinedIcon },
  EMPLOYEE_ACTIVATE: { label: 'Employee activated', color: '#0F766E', icon: ToggleOnOutlinedIcon },
  EMPLOYEE_DEACTIVATE: { label: 'Employee deactivated', color: '#B45309', icon: ToggleOffOutlinedIcon },
  SALARY_CREATE: { label: 'Salary created', color: '#0B3D5C', icon: PaidOutlinedIcon },
  SALARY_UPDATE: { label: 'Salary revised', color: '#0B3D5C', icon: SyncAltOutlinedIcon },
};

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

function actionMeta(action: string): ActionMeta {
  return (
    ACTION_META[action] ?? {
      label: action.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      color: '#5B738B',
      icon: HistoryEduOutlinedIcon,
    }
  );
}

function entityLabel(entityType: string) {
  if (entityType === 'employee') return 'Employee';
  if (entityType === 'salary_record') return 'Salary record';
  return entityType;
}

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function actorInitial(email: string | undefined) {
  return (email?.[0] ?? 'S').toUpperCase();
}

function JsonPane({ title, value }: { title: string; value: unknown }) {
  const text =
    value === null || value === undefined
      ? '—'
      : JSON.stringify(value, null, 2);

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: 2,
        border: `1px solid ${alpha('#0B3D5C', 0.1)}`,
        bgcolor: alpha('#FFFFFF', 0.92),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${alpha('#0B3D5C', 0.08)}`,
          bgcolor: alpha('#0B3D5C', 0.04),
        }}
      >
        <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.1em' }}>
          {title}
        </Typography>
      </Box>
      <Box
        component="pre"
        className="acme-scroll"
        sx={{
          m: 0,
          p: 1.5,
          maxHeight: 280,
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: '0.78rem',
          lineHeight: 1.55,
          color: 'text.primary',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {text}
      </Box>
    </Box>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        px: 3,
        textAlign: 'center',
        display: 'grid',
        placeItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha('#0B3D5C', 0.08),
          color: 'primary.main',
          border: `1px solid ${alpha('#0B3D5C', 0.12)}`,
          mb: 0.5,
        }}
      >
        <ShieldOutlinedIcon sx={{ fontSize: 30 }} />
      </Box>
      <Typography variant="h6" sx={{ color: 'primary.main' }}>
        {hasFilters ? 'No matching audit events' : 'No audit activity yet'}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420, lineHeight: 1.6 }}>
        {hasFilters
          ? 'Try clearing filters or choosing a broader entity and action combination.'
          : 'Employee and salary mutations will appear here as a traceable compliance trail.'}
      </Typography>
    </Box>
  );
}

export function AuditLogsPage() {
  const { can } = usePermissions();
  const canRead = can('audit:read');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [selected, setSelected] = useState<AuditLogItem | null>(null);

  const hasFilters = Boolean(entityType || action);

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

  const rows = logsQuery.data?.items ?? [];
  const total = logsQuery.data?.meta.total ?? 0;

  const selectedMeta = useMemo(
    () => (selected ? actionMeta(selected.action) : null),
    [selected],
  );
  const SelectedIcon = selectedMeta?.icon;

  if (!canRead) {
    return (
      <Alert severity="warning">
        Your role does not have permission to view audit logs (`audit:read`).
      </Alert>
    );
  }

  const clearFilters = () => {
    setEntityType('');
    setAction('');
    setPage(0);
  };

  return (
    <Stack spacing={2.5} className="acme-fade-up">
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
        <Paper
          sx={{
            px: 2,
            py: 1.25,
            minWidth: { sm: 180 },
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            borderRadius: 2.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha('#0B3D5C', 0.1),
              color: 'primary.main',
            }}
          >
            <HistoryEduOutlinedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Matching events
            </Typography>
            <Typography variant="h6" sx={{ lineHeight: 1.2, color: 'primary.main' }}>
              {logsQuery.isLoading ? '—' : total.toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      </Stack>

      <Paper
        sx={{
          p: { xs: 1.75, sm: 2 },
          borderRadius: 3,
          background:
            'linear-gradient(135deg, rgba(11,61,92,0.05) 0%, rgba(15,118,110,0.04) 45%, rgba(255,255,255,0.95) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { sm: 'center' } }}
        >
          <FormControl sx={{ minWidth: { sm: 200 }, flex: 1, ...filterFieldSx }}>
            <InputLabel>Entity</InputLabel>
            <Select
              label="Entity"
              value={entityType}
              onChange={(e) => {
                setPage(0);
                setEntityType(e.target.value);
              }}
            >
              {ENTITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all-entities'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: { sm: 240 }, flex: 1.2, ...filterFieldSx }}>
            <InputLabel>Action</InputLabel>
            <Select
              label="Action"
              value={action}
              onChange={(e) => {
                setPage(0);
                setAction(e.target.value);
              }}
            >
              {ACTION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all-actions'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={<FilterAltOffOutlinedIcon />}
            disabled={!hasFilters}
            onClick={clearFilters}
            sx={{
              height: 40,
              borderColor: alpha('#0B3D5C', 0.18),
              color: 'text.secondary',
              whiteSpace: 'nowrap',
              '&:hover': {
                borderColor: alpha('#0B3D5C', 0.35),
                bgcolor: alpha('#0B3D5C', 0.04),
              },
            }}
          >
            Clear filters
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {logsQuery.isLoading ? (
          <Box sx={{ p: 8, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : rows.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <TableContainer
              className="acme-scroll"
              sx={{ maxWidth: '100%', overflowX: 'auto' }}
            >
              <Table size="small" sx={{ minWidth: 780 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 72 }}>Event</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Actor</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>When</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell align="right" sx={{ width: 56 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const meta = actionMeta(row.action);
                    const Icon = meta.icon;
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        onClick={() => setSelected(row)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover .audit-row-chevron': {
                            color: 'primary.main',
                            transform: 'translateX(2px)',
                          },
                        }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              display: 'grid',
                              placeItems: 'center',
                              bgcolor: alpha(meta.color, 0.12),
                              color: meta.color,
                              border: `1px solid ${alpha(meta.color, 0.18)}`,
                            }}
                          >
                            <Icon sx={{ fontSize: 18 }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={meta.label}
                            sx={{
                              fontWeight: 600,
                              bgcolor: alpha(meta.color, 0.12),
                              color: meta.color,
                              border: `1px solid ${alpha(meta.color, 0.16)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 30,
                                height: 30,
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                bgcolor: alpha('#0B3D5C', 0.12),
                                color: 'primary.main',
                              }}
                            >
                              {actorInitial(row.actor?.email)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                                {row.actor?.email ?? 'system'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.actor?.role?.replaceAll('_', ' ') ?? 'Automated'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entityLabel(row.entityType)}
                          </Typography>
                          <Tooltip title={row.entityId}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}
                            >
                              {shortId(row.entityId)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatRelativeTime(row.createdAt)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(row.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <LanOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}
                            >
                              {row.ipAddress ?? '—'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            aria-label="View audit event details"
                            className="audit-row-chevron"
                            sx={{
                              color: 'text.secondary',
                              transition: 'color 160ms ease, transform 160ms ease',
                            }}
                          >
                            <ChevronRightOutlinedIcon fontSize="small" />
                          </IconButton>
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

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="md"
      >
        {selected && selectedMeta && SelectedIcon && (
          <>
            <AcmeDialogHeader
              title={selectedMeta.label}
              subtitle={`${entityLabel(selected.entityType)} · ${formatDateTime(selected.createdAt)}`}
              icon={<SelectedIcon fontSize="small" />}
              onClose={() => setSelected(null)}
            />
            <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, pb: 2 }}>
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ flexWrap: 'wrap' }}
                >
                  <Paper
                    sx={{
                      flex: 1,
                      minWidth: 180,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha('#FFFFFF', 0.9),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Actor
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                      {selected.actor?.email ?? 'system'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selected.actor?.role?.replaceAll('_', ' ') ?? 'Automated'}
                    </Typography>
                  </Paper>
                  <Paper
                    sx={{
                      flex: 1,
                      minWidth: 180,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha('#FFFFFF', 0.9),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Entity ID
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mt: 0.25,
                        fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {selected.entityId}
                    </Typography>
                  </Paper>
                  <Paper
                    sx={{
                      flex: 1,
                      minWidth: 140,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha('#FFFFFF', 0.9),
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      IP address
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        mt: 0.25,
                        fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
                      }}
                    >
                      {selected.ipAddress ?? '—'}
                    </Typography>
                  </Paper>
                </Stack>

                <Divider sx={{ borderColor: alpha('#0B3D5C', 0.08) }} />

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <JsonPane title="Before" value={selected.beforeJson} />
                  <JsonPane title="After" value={selected.afterJson} />
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button variant="contained" onClick={() => setSelected(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Stack>
  );
}
