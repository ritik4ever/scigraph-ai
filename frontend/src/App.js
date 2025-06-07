import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/shared/Navbar';
import Sidebar from './components/shared/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import PaperAnalyzer from './components/PaperAnalyzer/PaperAnalyzer';
import KnowledgeGraph from './components/KnowledgeGraph/KnowledgeGraph';
import HypothesisGenerator from './components/HypothesisGenerator/HypothesisGenerator';
import Loading from './components/shared/Loading';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00E5FF',
      light: '#62EFFF',
      dark: '#00B2CC',
    },
    secondary: {
      main: '#7C4DFF',
      light: '#B47CFF',
      dark: '#3F1DCB',
    },
    background: {
      default: '#0A0A0A',
      paper: '#1A1A1A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#1A1A1A',
          border: '1px solid #333',
        },
      },
    },
  },
});

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                pt: 8,
                pl: { md: sidebarOpen ? 30 : 8 },
                pr: 3,
                pb: 3,
                transition: 'padding 0.3s ease',
                background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 100%)',
                minHeight: '100vh',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/papers" element={<PaperAnalyzer />} />
                    <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
                    <Route path="/hypotheses" element={<HypothesisGenerator />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </Box>
          </Box>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1A1A',
              color: '#FFFFFF',
              border: '1px solid #333',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;