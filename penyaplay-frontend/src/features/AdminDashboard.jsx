import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Tabs, Tab, Paper, Button, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Chip, IconButton, Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../api/client';

function TabPanel({ children, value, index }) {
  return value === index && <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [pending, setPending] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch pending performers
    api.get('/admin/performers/pending').then(res => setPending(res.data)).catch(() => {});
    // Fetch all bookings
    api.get('/admin/bookings').then(res => setAllBookings(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [tab]); // Re-fetch when switching tabs

  const handleApproval = async (id, status) => {
    await api.patch(`/admin/performers/${id}/status`, { status });
    setPending(prev => prev.filter(p => p.id !== id));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h2" sx={{ mb: 4 }}>Administration</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`Verification Queue (${pending.length})`} />
          <Tab label="All Bookings" />
        </Tabs>
      </Box>

      {/* TAB 1: VERIFICATION QUEUE */}
      <TabPanel value={tab} index={0}>
        {loading ? <Typography>Loading...</Typography> : pending.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ color: 'primary.main' }}>All Clear!</Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>No performers pending review.</Typography>
          </Paper>
        ) : (
          <List>
            {pending.map(p => (
              <Paper key={p.id} sx={{ mb: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Avatar src={p.profile_img} sx={{ width: 56, height: 56, mr: 2 }} variant="rounded" />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={<Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.stage_name}</Typography>}
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Handle: @{p.handle} • {p.area}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                          {p.professions.map(prof => <Chip key={prof} label={prof} size="small" sx={{ bgcolor: 'rgba(212, 175, 55, 0.1)', color: 'primary.main' }} />)}
                        </Box>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    <Tooltip title="Approve"><IconButton color="success" onClick={() => handleApproval(p.id, 'approved')}><CheckCircleIcon /></IconButton></Tooltip>
                    <Tooltip title="Reject"><IconButton color="error" onClick={() => handleApproval(p.id, 'rejected')}><CancelIcon /></IconButton></Tooltip>
                  </Box>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </TabPanel>

      {/* TAB 2: ALL BOOKINGS */}
      <TabPanel value={tab} index={1}>
        {loading ? <Typography>Loading...</Typography> : (
          <Paper sx={{ bgcolor: 'background.paper' }}>
            <List>
              {allBookings.map(b => (
                <ListItem key={b.id} divider sx={{ py: 2 }}>
                  <ListItemText 
                    primary={<Typography sx={{ fontWeight: 600 }}>{b.performer_name} ← {b.promoter_name}</Typography>}
                    secondary={`${b.event_type || 'TBD'} • ${b.venue || 'N/A'} • ${new Date(b.event_date).toLocaleDateString()}`}
                  />
                  <Chip label={b.status.replace('_', ' ')} size="small" sx={{ fontWeight: 600 }} />
                </ListItem>
              ))}
              {allBookings.length === 0 && <Typography sx={{ p: 4, textAlign: 'center', color: 'text.disabled' }}>No bookings in system.</Typography>}
            </List>
          </Paper>
        )}
      </TabPanel>
    </Container>
  );
}