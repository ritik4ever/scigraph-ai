import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Settings,
  AccountCircle,
  GitHub,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Navbar = ({ onMenuClick }) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #00E5FF 30%, #7C4DFF 90%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              <Typography variant="h6" color="white" fontWeight="bold">
                S
              </Typography>
            </Box>
            <Typography variant="h6" component="div" fontWeight="bold">
              SciGraph AI
            </Typography>
          </Box>
        </motion.div>

        <Box sx={{ flexGrow: 1 }} />

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="View on GitHub">
            <IconButton
              color="inherit"
              component="a"
              href="https://github.com/yourusername/scigraph-ai"
              target="_blank"
            >
              <GitHub />
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton color="inherit">
              <Settings />
            </IconButton>
          </Tooltip>

          <Tooltip title="Profile">
            <IconButton color="inherit">
              <AccountCircle />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            sx={{
              ml: 2,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                background: 'rgba(0, 229, 255, 0.1)',
              },
            }}
          >
            Sign In
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
