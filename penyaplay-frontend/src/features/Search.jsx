import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, Box, Typography, TextField, Grid, Card, CardMedia, 
  CardContent, Chip, Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import AgreementIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import StarIcon from '@mui/icons-material/Star';
import { searchPerformers } from '../api/performers';

const CATEGORIES = ['All', 'DJs', 'Singers', 'Comedians', 'MCs', 'Dancers', 'Speakers', 'Photographers'];
const stepIcons = [
  <SearchIcon />, <SendIcon />, <ChatIcon />, 
  <AgreementIcon />, <SecurityIcon />, <StarIcon />
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const params = {};
      if (query) params.q = query;
      if (activeCategory !== 'All') params.category = activeCategory.toLowerCase(); 
      
      searchPerformers(params)
        .then(res => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  return (
    <Box>
      {/* HERO SECTION */}
      <Box sx={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <Box 
          component="img" 
          src="https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=2070&auto=format&fit=crop" 
          alt="Concert" 
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35) contrast(1.1) saturate(0.8)' }} 
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 50%, rgba(10,10,10,0.7) 100%)' }} />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 20 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>Southern Africa's Booking OS</Typography>
          <Typography variant="h1" sx={{ mb: 3 }}>
            Real People.<br />
            <Box component="span" sx={{ color: 'primary.main' }}>Fair Bookings.</Box>
          </Typography>
          <Typography variant="body1" sx={{ mb: 5, maxWidth: 600 }}>
            The trusted platform where Africa connects talent and opportunities. No hidden fees. No middlemen. Just honest deals.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="gold" 
              sx={{ py: 1.5, px: 5, fontSize: '0.95rem' }} 
              onClick={() => document.getElementById('discover')?.scrollIntoView({behavior:'smooth'})}
            >
              BOOK TALENT
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CATEGORY NAVIGATION */}
      <Box sx={{ py: 1.5, px: 2, borderBottom: '1px solid', borderColor: 'divider', overflowX: 'auto', display: 'flex', gap: 4, justifyContent: 'center' }}>
        {CATEGORIES.map(cat => (
          <Typography 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            sx={{ 
              color: activeCategory === cat ? 'primary.main' : 'text.disabled', 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              letterSpacing: 1.5, 
              textTransform: 'uppercase', 
              whiteSpace: 'nowrap', 
              cursor: 'pointer', 
              pb: 0.5, 
              borderBottom: activeCategory === cat ? '2px solid' : '2px solid transparent',
              borderColor: activeCategory === cat ? 'primary.main' : 'transparent',
              '&:hover': { color: 'primary.main' }
            }}
          >
            {cat}
          </Typography>
        ))}
      </Box>

      {/* SEARCH SECTION */}
      <Box id="discover" sx={{ py: { xs: 8, md: 12 }, px: 2 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h5">Discover</Typography>
          <Typography variant="h2" sx={{ mt: 1, mb: 4 }}>
            Any Talent. Any Venue.<br />
            <Box component="span" sx={{ color: 'primary.main' }}>Anywhere in Africa.</Box>
          </Typography>
          
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Who are you looking for today?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ 
                mb: 2, 
                '& .MuiOutlinedInput-root': { 
                  bgcolor: 'background.paper', 
                  borderRadius: 2, 
                  fontSize: '1rem',
                  '& .MuiOutlinedInput-input': { paddingLeft: '45px' } 
                } 
              }}
            />
            <Box sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'text.disabled', pointerEvents: 'none' }}>
              <SearchIcon />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* STATS SECTION */}
      <Box sx={{ py: 6, borderTop: '1px solid', borderColor: 'divider', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md">
          <Grid container spacing={4}>
            {['Real Talent', 'Honest Deals', 'Full Accountability'].map((label, i) => (
              <Grid item xs={4} key={i} sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ color: 'primary.main', mb: 0.5 }}>100%</Typography>
                <Typography variant="body2">{label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* HOW IT WORKS */}
      <Box id="how-it-works" sx={{ py: { xs: 8, md: 12 }, px: 2, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 0, right: -200, width: 500, height: 500, background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h5">How It Works</Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>
              Six steps to a <Box component="span" sx={{ color: 'primary.main' }}>fair deal</Box>
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {['Browse Profiles', 'Send a Brief', 'Negotiate Terms', 'Confirm Agreement', 'Secure Deposit', 'Deliver and Review'].map((step, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 4, 
                    height: '100%', 
                    bgcolor: 'background.paper', 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    position: 'relative', 
                    '&:hover': { 
                      borderColor: 'rgba(212, 175, 55, 0.25)', 
                      transform: 'translateY(-4px)', 
                      boxShadow: '0 12px 40px rgba(0,0,0,0.4)', 
                      transition: 'all 0.4s' 
                    }
                  }}
                >
                  <Typography variant="h2" sx={{ position: 'absolute', top: 16, right: 24, opacity: 0.3, lineHeight: 1 }}>
                    0{i+1}
                  </Typography>
                  <Box sx={{ p: 1 }}>
                    <Box 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(212, 175, 55, 0.08)', 
                        border: '1px solid rgba(212, 175, 55, 0.25)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        mb: 2, 
                        color: 'primary.main' 
                      }}
                    >
                      {stepIcons[i]}
                    </Box>
                    <Typography variant="h3" sx={{ mb: 1 }}>{step}</Typography>
                    <Typography variant="body2">
                      Structured, transparent, and accountable processes from start to finish.
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* MANIFESTO */}
      <Box id="manifesto" sx={{ py: { xs: 8, md: 14 }, px: 2, position: 'relative', overflow: 'hidden', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box 
          component="img" 
          src="https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=2070&auto=format&fit=crop" 
          alt="Landscape" 
          sx={{ 
            position: 'absolute', 
            inset: 0, 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            filter: 'brightness(0.2) saturate(0.5)' 
          }} 
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #0A0A0A 0%, transparent 30%, transparent 70%, #0A0A0A 100%)' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography variant="h5">The Manifesto</Typography>
          <Typography variant="h2" sx={{ mt: 2, mb: 3, fontSize: { xs: '2rem', md: '3.5rem' } }}>
            Every fair deal<br />
            <Box component="span" sx={{ color: 'primary.main' }}>builds a career.</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.disabled', lineHeight: 2, maxWidth: 600, m: '0 auto' }}>
            Every booking is an opportunity.<br />
            Every fair deal builds a reputation.<br />
            Every reputation builds a career.
          </Typography>
          <Box sx={{ width: 40, height: 1, bgcolor: 'primary.main', opacity: 0.5, m: '3rem auto 0' }} />
        </Container>
      </Box>

      {/* TALENT GRID */}
      <Box sx={{ py: { xs: 8, md: 12 }, px: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5">Verified Talent</Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>
              Book <Box component="span" sx={{ color: 'primary.main' }}>verified</Box> professionals
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {loading && (
              <Grid item xs={12}>
                <Typography sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                  Searching database...
                </Typography>
              </Grid>
            )}
            {!loading && results.length === 0 && query && (
              <Grid item xs={12}>
                <Typography sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                  No performers found matching "{query}"
                </Typography>
              </Grid>
            )}
            {!loading && results.length === 0 && !query && (
              <Grid item xs={12}>
                <Typography sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
                  Start typing to discover talent.
                </Typography>
              </Grid>
            )}

            {results.map(p => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                <Link 
                  to={`/book/${p.handle}`} 
                  style={{ textDecoration: 'none', color: 'inherit', height: '100%', display: 'block' }}
                >
                  <Card sx={{ height: '100%', cursor: 'pointer' }}>
                    <Box sx={{ position: 'relative', height: 280, overflow: 'hidden' }}>
                      <CardMedia 
                        component="img" 
                        image={p.profile_img} 
                        alt={p.stage_name} 
                        sx={{ height: '100%', objectFit: 'cover' }} 
                      />
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 12, 
                        left: 12, 
                        bgcolor: 'rgba(10,10,10,0.8)', 
                        backdropFilter: 'blur(8px)', 
                        p: '4px 12px', 
                        borderRadius: 0.5, 
                        fontSize: '0.7rem', 
                        fontWeight: 600, 
                        color: 'primary.main', 
                        letterSpacing: 0.5, 
                        textTransform: 'uppercase', 
                        border: '1px solid rgba(212, 175, 55, 0.25)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5 
                      }}>
                        <VisibilityIcon sx={{ fontSize: 12 }} /> Verified
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="h4" sx={{ mb: 0.5 }}>
                        {p.stage_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', mb: 0.5, fontWeight: 500 }}>
                        {p.professions.join(', ')}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        📍 {p.area}
                      </Typography>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}