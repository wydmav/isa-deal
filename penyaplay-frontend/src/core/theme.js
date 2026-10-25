import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#D4AF37', light: '#F5E6A3' }, // Gold
    secondary: { main: '#2E7D32' }, // Emerald
    background: {
      default: '#0A0A0A', // Matte black
      paper: '#141414',  // Graphite card
    },
    text: {
      primary: '#F5F5F5', // Warm white
      secondary: '#CCCCCC', // Dim white
      disabled: '#777777', // Muted
    },
    divider: 'rgba(255, 255, 255, 0.05)',
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '4rem', lineHeight: 1.1, color: '#F5F5F5' },
    h2: { fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '3rem', lineHeight: 1.15, color: '#F5F5F5' },
    h3: { fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '1.3rem', lineHeight: 1.2, color: '#F5F5F5' },
    h4: { fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.15rem', color: '#F5F5F5' },
    h5: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fontSize: '0.85rem', color: '#D4AF37', letterSpacing: '3px', textTransform: 'uppercase' },
    h6: { fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: '2rem', color: '#F5F5F5' },
    body1: { fontSize: '1.1rem', lineHeight: 1.7, color: '#CCCCCC' },
    body2: { fontSize: '0.9rem', lineHeight: 1.6, color: '#777777' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#0A0A0A', scrollbarWidth: 'thin', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { background: '#333', borderRadius: 3 } }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: 'transparent', boxShadow: 'none', borderBottom: '1px solid transparent', transition: 'all 0.4s' }
      }
    },
    MuiButton: {
      variants: [
        {
          props: { variant: 'gold' },
          style: { backgroundColor: '#D4AF37', color: '#0A0A0A', padding: '10px 24px', fontSize: '0.85rem', fontWeight: 600, borderRadius: 4, '&:hover': { backgroundColor: '#F5E6A3', transform: 'translateY(-1px)', boxShadow: '0 4px 20px rgba(212, 175, 55, 0.15)' } }
        },
        {
          props: { variant: 'outline-gold' },
          style: { border: '1px solid rgba(212, 175, 55, 0.25)', color: '#D4AF37', padding: '10px 24px', fontSize: '0.85rem', fontWeight: 500, borderRadius: 4, '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid #D4AF37' } }
        },
        {
          props: { variant: 'large' },
          style: { padding: '14px 36px', fontSize: '0.95rem' }
        }
      ]
    },
    MuiCard: {
      styleOverrides: {
        root: { backgroundColor: '#141414', border: '1px solid #1E1E1E', borderRadius: 12, transition: 'all 0.4s', '&:hover': { borderColor: 'rgba(212, 175, 55, 0.25)', transform: 'translateY(-6px)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' } }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#1E1E1E' }, '&:hover fieldset': { borderColor: '#2A2A2A' }, '&.Mui-focused fieldset': { borderColor: 'rgba(212, 175, 55, 0.25)' } }, '& .MuiInputBase-input': { color: '#F5F5F5' } }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: '#141414', border: '1px solid #1E1E1E', borderRadius: 16, maxWidth: 560, width: '100%' }
      }
    }
  }
});