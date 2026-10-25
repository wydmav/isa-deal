import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Container, Typography, Box, Button, Dialog, DialogTitle, 
  DialogContent, TextField, IconButton, Divider, InputAdornment, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../core/AuthContext';

// Reusable Gold Text Component
const Gold = ({ children, ...props }) => <Box component="span" sx={{ color: 'primary.main' }} {...props}>{children}</Box>;

export default function PublicLayout() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true); setAuthError('');
    try {
      await login(creds.email, creds.password);
      setAuthOpen(false); setCreds({ email: '', password: '' });
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    const map = { promoter: { e: 'lunar@events.com', p: 'promoter123' }, performer: { e: 'mpho@penyaplay.com', p: 'performer123' }, admin: { e: 'admin@penyaplay.com', p: 'admin123' } };
    setCreds(map[role]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation */}
      <AppBar position="fixed" sx={{ background: scrolled ? 'rgba(10,10,10,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid #1E1E1E' : '1px solid transparent' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ height: 72, justifyContent: 'space-between' }}>
            <Typography variant="h4" sx={{ flexGrow: 0, mr: 4, cursor: 'pointer', letterSpacing: 1 }} onClick={() => navigate('/')}>PENYA PLAY</Typography>
            
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 3 }}>
              {['Discover', 'How It Works', 'Talent'].map(item => (
                <Typography key={item} component="a" href={`/#${item.toLowerCase().replace(' ', '-')}`} sx={{ color: 'text.secondary', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, position: 'relative', '&:hover': { color: 'primary.main' } }}>
                  {item}
                </Typography>
              ))}
            </Box>

             <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
              {user ? (
                <>
                  <Button variant="text" sx={{ color: 'text.secondary' }} onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}>Dashboard</Button>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user.name}</Typography>
                  <Button variant="text" sx={{ color: 'text.secondary' }} onClick={logout}>Log out</Button>
                </>
              ) : (
                <>
                  <Button variant="text" sx={{ color: 'text.secondary' }} onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Log in</Button>
                  <Button variant="gold" onClick={() => { setAuthMode('signup'); setAuthOpen(true); }}>SIGN UP</Button>
                </>
              )}
              <IconButton sx={{ display: { md: 'none' }, color: '#F5F5F5' }} onClick={() => setMobileOpen(!mobileOpen)}><MenuIcon /></IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer Logic (Simplified inline for structure) */}
      {mobileOpen && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 1200, bgcolor: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', p: 4, display: { xs: 'block', md: 'none' } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Typography variant="h4">PENYA PLAY</Typography>
            <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#F5F5F5' }}><CloseIcon /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {['Discover', 'How It Works', 'Talent'].map(item => (
              <Typography key={item} variant="h6" component="a" href={`/#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileOpen(false)} sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>{item}</Typography>
            ))}
            {!user && <Button variant="gold" variant="large" sx={{ mt: 4 }} onClick={() => { setMobileOpen(false); setAuthOpen(true); }}>Sign up / Log in</Button>}
          </Box>
        </Box>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}><Outlet /></Box>

      {/* Footer */}
      <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', py: 6, px: 2 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' }, gap: 4, mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ mb: 1 }}>PENYA PLAY</Typography>
              <Typography variant="body2">Real people. Fair bookings. The trusted platform connecting Africa's talent and opportunities.</Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>Platform</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography component="a" href="/#discover" variant="body2" sx={{ color: 'text.disabled', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Discover Talent</Typography>
                <Typography component="a" href="/#how-it-works" variant="body2" sx={{ color: 'text.disabled', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>How It Works</Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>Company</Typography>
              <Typography component="a" href="/#manifesto" variant="body2" sx={{ color: 'text.disabled', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>Manifesto</Typography>
            </Box>
          </Box>
          <Divider sx={{ borderColor: 'divider' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2">&copy; 2025 Penya Play Booking OS. All rights reserved.</Typography>
            {/* Social Icons Placeholder */}
          </Box>
        </Container>
      </Box>

      {/* Auth Modal (Pure MUI Dialog) */}
      <Dialog open={authOpen} onClose={() => setAuthOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 0 }}>
          <Box>
            <Typography variant="h5">{authMode === 'login' ? 'Welcome Back' : 'Get Started'}</Typography>
            <Typography variant="h6">{authMode === 'login' ? 'Log in to Penya Play' : 'Create Account'}</Typography>
          </Box>
          <IconButton onClick={() => setAuthOpen(false)}><CloseIcon sx={{ color: 'text.disabled' }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form onSubmit={handleAuth}>
            <TextField fullWidth margin="normal" label="Email Address" type="email" value={creds.email} onChange={e => setCreds(p => ({...p, email: e.target.value}))} required />
            <TextField fullWidth margin="normal" label="Password" type="password" value={creds.password} onChange={e => setCreds(p => ({...p, password: e.target.value}))} required />
            {authError && <Typography color="error" sx={{ mt: 1, fontSize: '0.85rem' }}>{authError}</Typography>}
            <Button type="submit" variant="gold" variant="large" fullWidth sx={{ mt: 2, mb: 2 }} disabled={loading}>{loading ? 'Processing...' : (authMode === 'login' ? 'Log In' : 'Sign Up')}</Button>
          </form>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <Box component="span" sx={{ color: 'primary.main', fontWeight: 600, cursor: 'pointer' }} onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                {authMode === 'login' ? 'Sign up' : 'Log in'}
              </Box>
            </Typography>
          </Box>
          {authMode === 'login' && (
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ textAlign: 'center', mb: 1, color: 'text.secondary', fontWeight: 500 }}>Backend Test Accounts:</Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['promoter', 'performer', 'admin'].map(role => (
                  <Chip key={role} label={role.charAt(0).toUpperCase() + role.slice(1)} onClick={() => fillDemo(role)} sx={{ color: 'primary.main', border: '1px solid rgba(212, 175, 55, 0.25)', '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.08)' } }} />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}