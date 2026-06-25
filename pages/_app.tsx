import type { AppProps } from 'next/app';
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Header, Footer } from '../components';
// @ts-ignore: Side-effect import of CSS module without type declarations
import '../styles/globals.css';

// Routes that participate in SPA keep-alive (shared Header/Footer, pages stay mounted)
const SPA_ROUTES = new Set(['/', '/about']);

const theme = createTheme({
  typography: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
  },
  palette: {
    primary: {
      main: '#0097b2',
      light: '#01b1de',
      dark: '#00557b',
    },
    secondary: {
      main: '#ffbc01',
      light: '#ffce6d',
      dark: '#054365',
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
  const router = useRouter();
  const path = router.pathname;
  const isSpaRoute = SPA_ROUTES.has(path);

  /**
   * useRef (not a module-level Map) so that:
   *  - Each server render starts with an empty cache → server and client produce
   *    the same initial HTML → no hydration mismatch.
   *  - The client instance persists across route changes → pages stay mounted after
   *    first visit → instant switching.
   */
  const cacheRef = useRef<
    Map<string, { Component: AppProps['Component']; pageProps: Record<string, unknown> }>
  >(new Map());

  // Populate cache for the current SPA route (mutating a ref during render is intentional)
  if (isSpaRoute) {
    cacheRef.current.set(path, { Component, pageProps });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {isSpaRoute ? (
        // ── SPA layout ──────────────────────────────────────────────────────
        // Header + Footer rendered once; page bodies toggled with CSS display.
        // Components never unmount after first visit → zero-latency tab switching.
        <>
          <Header />

          {Array.from(cacheRef.current.entries()).map(
            ([cachedPath, { Component: CachedComp, pageProps: cachedProps }]) => (
              <div
                key={cachedPath}
                style={{ display: path === cachedPath ? 'block' : 'none' }}
              >
                {/* spaActive = false on hidden pages suppresses their <Head> meta */}
                <CachedComp {...cachedProps} spaActive={path === cachedPath} />
              </div>
            )
          )}

          <Footer />
        </>
      ) : (
        // ── Normal layout ──────────────────────────────────────────────────
        // Non-SPA pages (e.g. [slug]) include their own Header / Footer.
        <Component {...pageProps} />
      )}
    </ThemeProvider>
  );
}
