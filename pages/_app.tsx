import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '../styles/globals.css';

// Create custom MUI theme with Inter font and color scheme
const theme = createTheme({
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
  },
  palette: {
    primary: {
      main: '#0097b2', // var(--color-primary-teal)
      light: '#01b1de', // var(--color-primary-light-blue)
      dark: '#00557b', // var(--color-primary-dark-blue)
    },
    secondary: {
      main: '#ffbc01', // var(--color-primary-yellow)
      light: '#ffce6d', // var(--color-secondary-light-yellow)
      dark: '#054365', // var(--color-primary-navy)
    },
    background: {
      default: '#ffffff',
      paper: '#f6f6e9',
    },
    text: {
      primary: '#211d1e',
      secondary: '#057184',
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
} 