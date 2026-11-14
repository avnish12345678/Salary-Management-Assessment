import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import { useState, type MouseEvent } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AcmeLogo } from '../components/AcmeLogo';
import { useAuth } from '../features/auth/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: 'Employees', to: '/employees', icon: <GroupsOutlinedIcon fontSize="small" /> },
  { label: 'Salary Management', to: '/salaries', icon: <PaymentsOutlinedIcon fontSize="small" /> },
  { label: 'Salary History', to: '/salary-history', icon: <HistoryOutlinedIcon fontSize="small" /> },
  { label: 'Reports', to: '/reports', icon: <AssessmentOutlinedIcon fontSize="small" /> },
  { label: 'Audit Logs', to: '/audit', icon: <FactCheckOutlinedIcon fontSize="small" /> },
  { label: 'Settings', to: '/settings', icon: <SettingsOutlinedIcon fontSize="small" /> },
];

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuOpen = Boolean(userMenuAnchor);

  const openUserMenu = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const closeUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    closeUserMenu();
    setMobileOpen(false);
    await logout();
    navigate('/login');
  };

  const goToSettings = () => {
    closeUserMenu();
    navigate('/settings');
  };

  const mobileDrawer = (
    <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 2.5, py: 2.5 }}>
        <AcmeLogo />
      </Box>
      <Divider />
      <List sx={{ flex: 1, px: 1.25, py: 1.5 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2.5,
              mb: 0.5,
              '&.active': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'inherit' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 38, height: 38 }}>
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role?.replaceAll('_', ' ')}
            </Typography>
          </Box>
        </Stack>
        <ListItemButton
          onClick={() => {
            setMobileOpen(false);
            navigate('/settings');
          }}
          sx={{ borderRadius: 2.5 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <SettingsOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2.5 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        className="acme-soft-in"
        sx={{
          flexShrink: 0,
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '100%',
          m: 0,
          p: 0,
          borderRadius: 0,
          border: 'none',
          borderBottom: `1px solid ${alpha(theme.palette.primary.dark, 0.1)}`,
          bgcolor: alpha('#FFFFFF', 0.96),
          backdropFilter: 'blur(16px)',
          backgroundImage: 'none',
          boxShadow: '0 8px 24px rgba(7, 25, 38, 0.04)',
          overflow: 'hidden',
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            gap: 1,
            width: '100%',
            minHeight: { xs: 64, lg: 72 },
            height: { xs: 64, lg: 72 },
            px: { xs: 2, md: 3 },
            m: 0,
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
          )}

          <Box
            component={NavLink}
            to="/dashboard"
            aria-label="ACME Salary Intelligence home"
            sx={{
              mr: { lg: 1.5 },
              flexShrink: 0,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <AcmeLogo compact />
          </Box>

          {!isMobile && (
            <Stack
              direction="row"
              spacing={0.35}
              sx={{
                flex: 1,
                minWidth: 0,
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
              }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  color="inherit"
                  disableRipple
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    minWidth: 0,
                    borderRadius: 0,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontWeight: 500,
                    bgcolor: 'transparent',
                    borderBottom: '2px solid transparent',
                    transition: 'color 160ms ease, border-color 160ms ease, font-weight 160ms ease',
                    '&.active': {
                      bgcolor: 'transparent',
                      color: 'primary.main',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      textUnderlineOffset: '6px',
                      textDecorationThickness: '2px',
                      borderBottomColor: 'transparent',
                    },
                    '&:hover': {
                      bgcolor: 'transparent',
                      color: 'primary.main',
                    },
                    '&.active:hover': {
                      bgcolor: 'transparent',
                      color: 'primary.main',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          )}

          {isMobile && <Box sx={{ flex: 1 }} />}

          <IconButton
            onClick={openUserMenu}
            aria-label="Open user menu"
            aria-controls={userMenuOpen ? 'user-account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={userMenuOpen ? 'true' : undefined}
            sx={{
              ml: 'auto',
              flexShrink: 0,
              p: 0.35,
              border: '1px solid',
              borderColor: userMenuOpen ? 'primary.main' : 'divider',
              bgcolor: alpha('#FFFFFF', 0.75),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                width: 36,
                height: 36,
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </Avatar>
          </IconButton>

          <Menu
            id="user-account-menu"
            anchorEl={userMenuAnchor}
            open={userMenuOpen}
            onClose={closeUserMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 260,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 16px 40px rgba(7, 25, 38, 0.12)',
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40 }}>
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                    {user?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user?.role?.replaceAll('_', ' ')}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <Divider />
            <MenuItem
              onClick={goToSettings}
              sx={{ py: 1.25, gap: 1.25 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.25, gap: 1.25, color: 'error.main' }}>
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                <LogoutOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: 300, border: 'none' },
        }}
      >
        {mobileDrawer}
      </Drawer>

      <Box
        component="main"
        className="acme-scroll"
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#0B3D5C #E8F0F5',
          '&::-webkit-scrollbar': { width: 10, height: 10 },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#E8F0F5',
            borderRadius: 999,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #0B3D5C 0%, #1F5F84 100%)',
            borderRadius: 999,
            border: '2px solid #E8F0F5',
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #0F766E 0%, #0B3D5C 100%)',
            border: '2px solid #E8F0F5',
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-button': { display: 'none', width: 0, height: 0 },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            minHeight: '100%',
            boxSizing: 'border-box',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, md: 3 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
