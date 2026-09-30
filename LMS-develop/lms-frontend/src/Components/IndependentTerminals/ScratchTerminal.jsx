import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Button, 
  AppBar, 
  Toolbar, 
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { useNavigate } from "react-router-dom";

const ScratchTerminal = () => {
  const navigate = useNavigate();
  const baseScratchUrl = import.meta.env.VITE_SCRATCH_URL || "http://localhost:8602";
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  const role =
    localStorage.getItem("userRole") ||
    localStorage.getItem("role") ||
    localStorage.getItem("userType") ||
    "teacher";
  const dashboardPath =
    role === "teacher"
      ? "/teacher-dashboard"
      : role === "student"
        ? "/student-dashboard"
        : role === "admin"
          ? "/admin-dashboard"
          : "/";
  const scratchUrl = `${baseScratchUrl}?token=${encodeURIComponent(token || "")}&username=${encodeURIComponent(username || "")}&role=${encodeURIComponent(role)}`;

  const handleOpenScratch = () => {
    window.open(scratchUrl, '_blank');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '50vh' }}>
      {/* App Bar */}
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate(dashboardPath)}
            sx={{
              mr: 2,
              color: "#fff",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Dashboard
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Scratch Editor
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenScratch}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Open in New Tab
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container 
        maxWidth={false} 
        sx={{ 
          width: '100%',
          maxWidth: '1100px',
          minHeight: 'calc(100vh - 96px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          py: 3 
        }}
      >
        <Stack spacing={2} sx={{ width: "100%", mb: 2 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            If Scratch does not load here, use <strong>Open in New Tab</strong>. The
            editor depends on the local Scratch server running on port 8602.
          </Alert>
        </Stack>
        <Paper 
          elevation={2} 
          sx={{ 
            width: '100%',
            maxWidth: '960px',
            height: '620px',
            overflow: 'hidden',
            borderRadius: 2 
          }}
        >
          <iframe
            src={scratchUrl}
            title="Scratch Editor"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            frameBorder="0"
            scrolling="no"
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default ScratchTerminal;
