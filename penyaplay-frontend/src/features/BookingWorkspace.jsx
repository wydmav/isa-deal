import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { 
  Container, Paper, Typography, Box, TextField, Button, Chip, Divider, Grid, 
  Rating, Alert, IconButton, InputAdornment, Stepper, Step, StepLabel, 
  StepContent, CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send'; 
import { getBooking, updateStatus, markPaidOffline, sendQuote, submitReview, postMessage } from '../api/bookings';
import { useAuth } from '../core/AuthContext';

// Map backend statuses to spine steps
const getActiveStep = (status) => {
  const map = { new: 0, viewed: 0, quote_sent: 1, confirmed: 2, paid: 3, completed: 4 };
  return map[status] !== undefined ? map[status] : 0;
};

const SPINE_STEPS = ['Discuss Terms', 'Agreement & Quote', 'Manual Payment Log', 'Performance', 'Review'];

export default function BookingWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const chatEndRef = useRef(null);

  const fetchBooking = async () => {
    try {
      const res = await getBooking(id);
      setBooking(res.data);
    } catch (err) {
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [booking?.messages]);

  const handleAction = async (action, payload) => {
    try {
      let res;
      if (action === 'status') res = await updateStatus(id, payload);
      if (action === 'paid') res = await markPaidOffline(id);
      if (action === 'quote') res = await sendQuote(id, quoteAmount, booking.budget_currency);
      if (action === 'review') { await submitReview(id, reviewData); res = await getBooking(id); }
      if (action === 'message') { await postMessage(id, payload); setMessage(''); res = await getBooking(id); }
      if (res) setBooking(res.data);
      setQuoteAmount('');
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.');
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress color="primary" /></Box>;
  if (!booking) return (
    <Container sx={{ py: 10, textAlign: 'center' }}>
      <Alert severity="info" sx={{ maxWidth: 400, mx: 'auto' }}>Booking Request not found or access restricted.</Alert>
      <Button component={RouterLink} to="/" sx={{ mt: 2 }}>Back to Discovery</Button>
    </Container>
  );

  const isPerformer = user?.id === booking.performer_id;
  const isPromoter = user?.id === booking.promoter_id;
  const canReview = booking.status === 'completed' && !booking.reviews.find(r => r.reviewer_id === user?.id);
  const chatDisabled = ['completed', 'declined', 'expired', 'cancelled'].includes(booking.status);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* THE SPINE TRACKER */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Booking Workflow</Typography>
        <Stepper activeStep={getActiveStep(booking.status)} nonLinear>
          {SPINE_STEPS.map((label, index) => (
            <Step key={label} completed={getActiveStep(booking.status) > index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Grid container spacing={3}>
        {/* LEFT: Discuss Terms (Chat) */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '65vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
              <Typography variant="h6">Negotiation Chat</Typography>
              <Chip label={booking.status.replace('_', ' ').toUpperCase()} color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            <Divider />
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {booking.messages.map(msg => (
                <Box key={msg.id} sx={{ alignSelf: msg.type === 'system' ? 'center' : (msg.sender_id === user?.id ? 'flex-end' : 'flex-start'), maxWidth: '80%' }}>
                  <Paper sx={{ p: 1.5, bgcolor: msg.type === 'system' ? 'transparent' : (msg.sender_id === user?.id ? 'rgba(212, 175, 55, 0.1)' : '#1E1E1E'), boxShadow: 'none' }}>
                    {msg.type !== 'system' && <Typography variant="caption" display="block" color="text.disabled" sx={{ mb: 0.5, fontSize: '0.7rem' }}>{msg.sender_name}</Typography>}
                    <Typography variant="body2" sx={{ color: msg.type === 'system' ? 'text.disabled' : 'text.primary', whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>
                  </Paper>
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Box>

            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleAction('message', message); setSendingMsg(true); setTimeout(()=>setSendingMsg(false), 500); }} sx={{ display: 'flex', gap: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <TextField fullWidth size="small" placeholder={chatDisabled ? "Chat closed." : "Discuss terms..."} value={message} onChange={e => setMessage(e.target.value)} disabled={chatDisabled || !user || sendingMsg} />
              <IconButton type="submit" color="primary" disabled={chatDisabled || !user}><SendIcon /></IconButton>
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT: The Spine Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6">{booking.event_type || 'Event Details'}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>{booking.venue}, {booking.city}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>Date: {new Date(booking.event_date).toLocaleDateString()}</Typography>

            <Divider sx={{ my: 2 }} />

            {/* STEP 1: QUOTE (Performer) */}
            {isPerformer && ['new', 'viewed'].includes(booking.status) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 1, fontWeight: 600 }}>Send a Quote</Typography>
                <TextField fullWidth size="small" label="Quote Amount" type="number" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} sx={{ mb: 1 }} />
                <Button variant="gold" fullWidth onClick={() => handleAction('quote')} disabled={!quoteAmount}>Send Quote</Button>
              </Box>
            )}

            {/* STEP 2: AGREEMENT (Promoter) */}
            {isPromoter && booking.status === 'quote_sent' && (
              <Button variant="gold" fullWidth onClick={() => handleAction('status', 'confirmed')} sx={{ mb: 3 }}>
                Accept Quote & Confirm Agreement
              </Button>
            )}

            {/* STEP 3: MANUAL PAYMENT LOG (Promoter) */}
            {isPromoter && booking.status === 'confirmed' && (
              <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'rgba(212, 175, 55, 0.25)', borderRadius: 1, bgcolor: 'rgba(212, 175, 55, 0.05)' }}>
                <Typography variant="h6" color="primary" sx={{ fontSize: '1rem' }}>Manual Payment Log</Typography>
                <Typography variant="body2" sx={{ my: 1 }}>Agreed Total: <strong>{booking.paymentInfo?.totalFormatted}</strong></Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>Deposit ({booking.paymentInfo?.depositPct}%): <strong>{booking.paymentInfo?.depositFormatted}</strong></Typography>
                
                {/* OS Rule: No escrow, no gateway text */}
                <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.8rem', color: 'text.secondary' } }}>
                  No automated payments. Arrange offline transfer as instructed below.
                </Alert>
                <Typography variant="body2" sx={{ mb: 2, fontSize: '0.8rem', color: 'text.disabled', whiteSpace: 'pre-wrap' }}>{booking.paymentInfo?.instructions}</Typography>
                
                <Button variant="outline-gold" fullWidth onClick={() => handleAction('paid')}>
                  Mark as Paid Offline
                </Button>
              </Box>
            )}

            {/* STEP 4: PERFORMANCE (Promoter) */}
            {isPromoter && booking.status === 'paid' && (
              <Button variant="gold" fullWidth onClick={() => handleAction('status', 'completed')} sx={{ mb: 3 }}>
                Confirm Performance Completion
              </Button>
            )}

            {/* STEP 5: REVIEW (Both) */}
            {canReview && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Leave a Review</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontSize: '0.8rem' }}>Exactly one review per party. Reviews are permanent.</Typography>
                <Rating value={reviewData.rating} onChange={(e, val) => setReviewData(p => ({...p, rating: val}))} sx={{ mb: 1 }} />
                <TextField fullWidth multiline rows={2} placeholder="Share your experience..." value={reviewData.comment} onChange={e => setReviewData(p => ({...p, comment: e.target.value}))} sx={{ mb: 1 }} />
                <Button variant="outline-gold" fullWidth onClick={() => handleAction('review')}>Submit Review</Button>
              </Box>
            )}

            {/* SHOW EXISTING REVIEWS */}
            {booking.reviews.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Professional Reputation</Typography>
                {booking.reviews.map(r => (
                  <Paper key={r.id} sx={{ p: 1.5, mt: 1, bgcolor: '#1E1E1E' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={r.rating} size="small" readOnly />
                      <Typography variant="caption">{r.reviewer_name}</Typography>
                    </Box>
                    {r.comment && <Typography variant="body2" sx={{ mt: 0.5 }}>{r.comment}</Typography>}
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}