import React, { useState } from 'react';
import { Container, TextField, Button, Box, Typography, Grid, Paper, Divider, MenuItem, InputLabel, FormControl, Select } from '@mui/material';
import { createBooking } from '../api/bookings';
import { useAuth } from '../core/AuthContext';

const EVENT_TYPES = ['Corporate Gala', 'Club Night', 'Festival', 'Private Party', 'Wedding', 'Other'];
const CURRENCIES = ['LSL', 'ZAR', 'BWP', 'NAD', 'SZL'];

export default function BookingForm({ performerHandle, performerName, prefillName, prefillEmail, onSuccess, onCancel }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    requesterName: prefillName || '', promoterEmail: prefillEmail || '', phone: '',
    eventDate: '', eventType: '', budget: '', budgetCurrency: 'LSL',
    duration: '', venue: '', city: '', country: '', requirements: '',
    termsAccepted: false, _hp: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await createBooking({ ...form, performerHandle });
      if (!user) {
        setSuccess(true);
      } else {
        onSuccess('success');
      }
    } catch (err) {
      setError(err.response?.data?.details?.fields?.[0] || err.response?.data?.error || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // Guest Success Screen (Zero icon imports to crash)
  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 80, mb: 3 }}>✅</Typography>
        <Typography variant="h3" sx={{ mb: 2 }}>Structured Brief Sent!</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
          Your request has been sent to <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{performerName}</Box>.
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled', mb: 4 }}>
          To discuss terms and track this booking, please log in to your account.
        </Typography>
        <Button 
          variant="gold" 
          onClick={() => window.location.href = '/'}
          sx={{ px: 6, py: 1.5 }}
        >
          Back to Discovery
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h3" gutterBottom>Submit Structured Brief</Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mb: 4 }}>
          Sending request to <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{performerName}</Box>
        </Typography>
        
        {error && <Typography color="error" sx={{ mb: 3, p: 1.5, bgcolor: 'rgba(239,68,68,0.1)', borderRadius: 1 }}>{error}</Typography>}

        <form onSubmit={handleSubmit}>
          <input type="hidden" name="_hp" value={form._hp} onChange={handleChange} tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px' }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField fullWidth label="Requester Name *" name="requesterName" value={form.requesterName} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email Address *" type="email" name="promoterEmail" value={form.promoterEmail} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Event Date *" type="date" name="eventDate" value={form.eventDate} onChange={handleChange} required InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Event Type *</InputLabel>
                <Select name="eventType" value={form.eventType} label="Event Type *" onChange={handleChange}>
                  <MenuItem value="" disabled>Select type</MenuItem>
                  {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Budget (e.g. 5000) *" type="number" name="budget" value={form.budget} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Currency *</InputLabel>
                <Select name="budgetCurrency" value={form.budgetCurrency} label="Currency *" onChange={handleChange}>
                  {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Duration *" name="duration" value={form.duration} onChange={handleChange} required placeholder="e.g. 2 hours" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Venue Name *" name="venue" value={form.venue} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="City" name="city" value={form.city} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Country" name="country" value={form.country} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Requirements" name="requirements" value={form.requirements} onChange={handleChange} multiline rows={3} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '0.9rem', color: '#CCC' }}>
            <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={handleChange} style={{ width: 18, height: 18, accentColor: '#D4AF37' }} />
            I acknowledge this is a structured booking request.
          </label>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" variant="gold" fullWidth disabled={loading || !form.termsAccepted} sx={{ py: 1.5 }}>
              {loading ? 'Sending...' : 'Send Booking Request'}
            </Button>
            <Button variant="outline-gold" onClick={onCancel} sx={{ minWidth: 120, py: 1.5 }}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}