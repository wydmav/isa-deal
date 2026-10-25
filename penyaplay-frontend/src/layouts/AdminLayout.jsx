import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, AppBar, Toolbar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../core/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0A0A0A' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1E1E1E' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 72, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Typography variant="h4" sx={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>PENYA PLAY</Typography>
              <Typography variant="body2" sx={{ px: 2, py: 0.5, bgcolor: 'rgba(212, 175, 55, 0.1)', borderRadius: 1, color: 'primary.main', fontWeight: 600, fontSize: '0.75rem', letterSpacing: 1 }}>ADMIN PANEL</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user?.name}</Typography>
              <Button variant="text" startIcon={<LogoutIcon />} sx={{ color: 'text.disabled' }} onClick={handleLogout}>Logout</Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Box>
    </Box>
  );
}