import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, Box, Tabs, Tab, Paper, Grid, Card, CardContent, 
  Chip, Button, Stepper, Step, StepLabel, LinearProgress, List, ListItem, 
  ListItemText, ListItemIcon, Avatar
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PersonIcon from '@mui/icons-material/Person';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../api/client';
import { useAuth } from '../core/AuthContext';

const PROFILE_STEPS = ['Basic Info', 'Media & Bio', 'Packages & Pricing'];

function TabPanel({ children, value, index }) {
  return value === index && <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const isPerformer = user?.role === 'performer';
  const completionPct = user?.performer?.completion_pct || 0;

  // Calculate active step for the progress tracker
  const activeStep = completionPct >= 80 ? 3 : completionPct >= 50 ? 2 : completionPct >= 20 ? 1 : 0;

  useEffect(() => {
    api.get('/bookings').then(res => {
      setBookings(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    const map = { new: '#777', viewed: '#2196F3', quote_sent: '#FF9800', confirmed: '#D4AF37', paid: '#9C27B0', completed: '#4CAF50', declined: '#F44336', cancelled: '#F44336' };
    return map[status] || '#777';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>Welcome, {user?.name}</Typography>
      <Typography variant="body2" sx={{ mb: 4, textTransform: 'uppercase', letterSpacing: 1, color: 'primary.main', fontWeight: 600 }}>
        {isPerformer ? 'Performer Portal' : 'Promoter Portal'}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label="My Bookings" icon={<EventNoteIcon />} iconPosition="start" />
          {isPerformer && <Tab label="Profile Progress" icon={<PersonIcon />} iconPosition="start" />}
        </Tabs>
      </Box>

      {/* TAB 1: BOOKINGS LIST */}
      <TabPanel value={tab} index={0}>
        {loading ? <Typography>Loading bookings...</Typography> : 
        bookings.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ color: 'text.disabled' }}>No bookings yet</Typography>
            <Button variant="gold" sx={{ mt: 2 }} onClick={() => navigate('/')}>Discover Talent</Button>
          </Paper>
        ) : (
          <List>
            {bookings.map(b => (
              <Paper key={b.id} sx={{ mb: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: 'rgba(212, 175, 55, 0.25)' } }} onClick={() => navigate(`/bookings/${b.id}`)}>
                <ListItem sx={{ py: 2, px: 3 }}>
                  <ListItemIcon><EventNoteIcon sx={{ color: 'text.disabled' }} /></ListItemIcon>
                  <ListItemText 
                    primary={<Typography sx={{ fontWeight: 600 }}>{b.event_type || 'Event'}</Typography>}
                    secondary={`${b.venue || 'TBD'} • ${new Date(b.event_date).toLocaleDateString()}`}
                  />
                  <Chip 
                    label={b.status.replace('_', ' ')} 
                    sx={{ fontWeight: 700, color: '#fff', bgcolor: getStatusColor(b.status) }} 
                    size="small"
                  />
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </TabPanel>

      {/* TAB 2: PERFORMER PROGRESS TRACKER */}
      {isPerformer && (
        <TabPanel value={tab} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Profile Completion</Typography>
                  <Typography variant="h6" sx={{ color: 'primary.main' }}>{completionPct}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={completionPct} sx={{ height: 8, borderRadius: 4, bgcolor: '#1E1E1E', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 4 } }} />
                
                <Typography variant="body2" sx={{ mt: 3, mb: 2, color: 'text.secondary' }}>
                  Complete these steps to unlock the "Booking Button™" and appear in public search.
                </Typography>

                <Stepper activeStep={activeStep} orientation="vertical" connector={null}>
                  {PROFILE_STEPS.map((label, i) => (
                    <Step key={label} completed={i < activeStep}>
                      <StepLabel 
                        StepIconProps={{ 
                          icon: i < activeStep ? <CheckCircleIcon sx={{ color: 'primary.main' }} /> : <Avatar sx={{ width: 24, height: 24, bgcolor: '#1E1E1E', color: 'text.disabled', fontSize: '0.8rem' }}>{i + 1}</Avatar>
                        }}
                        sx={{ '& .MuiStepLabel-label': { color: i <= activeStep ? '#F5F5F5' : '#777' } }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Current Status</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Stage Name</Typography>
                    <Typography variant="body2" sx={{ color: user?.performer?.stage_name ? 'primary.main' : 'error.main' }}>{user?.performer?.stage_name || 'Missing'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Profile Image</Typography>
                    <Typography variant="body2" sx={{ color: user?.performer?.profile_img ? 'primary.main' : 'error.main' }}>{user?.performer?.profile_img ? 'Uploaded' : 'Missing'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Bio</Typography>
                    <Typography variant="body2" sx={{ color: user?.performer?.bio ? 'primary.main' : 'error.main' }}>{user?.performer?.bio ? 'Added' : 'Missing'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Packages</Typography>
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>Add via Admin for now</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Verification</Typography>
                    <Chip label={user?.performer?.verification_status || 'Pending'} size="small" sx={{ fontWeight: 600, textTransform: 'uppercase', bgcolor: user?.performer?.verification_status === 'approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)', color: user?.performer?.verification_status === 'approved' ? '#4CAF50' : '#FF9800' }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      )}
    </Container>
  );
}