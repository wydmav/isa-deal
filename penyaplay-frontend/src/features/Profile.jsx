import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Grid, Paper, Button, Chip, Divider, Rating, CircularProgress } from '@mui/material';
import { getPerformerProfile } from '../api/performers';
import { useAuth } from '../core/AuthContext';
import BookingForm from './BookingForm';

export default function Profile() {
  const { handle } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getPerformerProfile(handle)
      .then(res => setProfile(res.data))
      .catch(() => window.location.href = '/')
      .finally(() => setLoading(false));
  }, [handle]);

  if (loading) return <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress color="primary" /></Box>;
  if (!profile) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {!showForm ? (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box component="img" src={profile.profileImg} sx={{ width: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} alt={profile.stageName} />
            <Typography variant="h2" sx={{ mt: 2 }}>{profile.stageName}</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>{profile.area}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {profile.professions.map(p => <Chip key={p} label={p} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600 }} />)}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Rating value={profile.reputation.averageRating} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary">({profile.reputation.totalReviews} reviews)</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom>About</Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.8 }}>{profile.bio}</Typography>
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h3" gutterBottom>Booking Packages</Typography>
            {profile.packages.length === 0 && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.900', border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                <Typography color="text.disabled">Contact for custom pricing.</Typography>
              </Paper>
            )}
            {profile.packages.map(pkg => (
              <Paper key={pkg.id} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{pkg.title}</Typography>
                    <Typography variant="body2" color="text.secondary">Duration: {pkg.duration} mins</Typography>
                  </Box>
                  <Typography variant="h4" color="primary">{pkg.formatted || 'Request a quote'}</Typography>
                </Box>
              </Paper>
            ))}

            <Button variant="gold" size="large" fullWidth onClick={() => setShowForm(true)} sx={{ mt: 2, py: 1.5, fontSize: '1.1rem' }}>
              Booking Button™
            </Button>
          </Grid>
        </Grid>
      ) : (
        <BookingForm 
          performerHandle={handle} 
          performerName={profile.stageName}
          prefillName={user?.name || ''} 
          prefillEmail={user?.email || ''} 
          onSuccess={(id) => window.location.href = `/bookings/${id}`}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Container>
  );
}