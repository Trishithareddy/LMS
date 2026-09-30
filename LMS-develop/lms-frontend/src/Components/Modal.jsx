import React from 'react';
import {
  Dialog,
  DialogTitle,
  Box,
  Card,
  CardActionArea,
  Typography,
  IconButton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CodeIcon from '@mui/icons-material/Code';
import { useNavigate } from 'react-router-dom';

const DestinationModal = ({ open, userType }) => {

  const navigate = useNavigate();
  
  
  const handleLMSChoice = () => {
  
    navigate(`/${userType}-dashboard`);
  };



const handleScratchChoice = () => {
 
    let scratchUrl;
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    switch(userType) {
        case 'student':
            scratchUrl = `http://localhost:8602/?token=${token}&username=${username}&role=${userType}`;
            break;
        case 'teacher':
            scratchUrl = `http://localhost:8602/?token=${token}&username=${username}&role=${userType}`;
            break;
        case 'admin':
            scratchUrl = `http://localhost:8602/demo?token=${token}&username=${username}&role=${userType}`;
            break;
        default:
            scratchUrl = `http://localhost:8602?token=${token}&username=${username}&role=${userType}`;
    }

    window.location.href = scratchUrl;
};

  return (
    <Dialog 
      open={open} 
      maxWidth="md"
      PaperProps={{
        sx: { 
          borderRadius: 2,
          minWidth: '600px',
          padding: 2
        }
      }}
    >
      <DialogTitle 
        align="center" 
        sx={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          mb: 2 
        }}
      >
        Choose Your Destination
      </DialogTitle>

      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 4, 
          px: 4, 
          pb: 4 
        }}
      >
        {/* LMS Dashboard Card */}
        <Card 
          sx={{ 
            width: 240,
            height: 200,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.03)' }
          }}
        >
          <CardActionArea 
            onClick={handleLMSChoice}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              p: 2
            }}
          >
            <IconButton 
              sx={{ 
                backgroundColor: 'primary.light',
                width: 60,
                height: 60,
                '&:hover': { backgroundColor: 'primary.main' }
              }}
            >
              <DashboardIcon sx={{ fontSize: 30, color: 'white' }} />
            </IconButton>
            <Typography variant="h6" component="div">
              LMS Dashboard
            </Typography>
          </CardActionArea>
        </Card>

        {/* Scratch Editor Card */}
        <Card 
          sx={{ 
            width: 240,
            height: 200,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.03)' }
          }}
        >
          <CardActionArea 
            onClick={handleScratchChoice}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              p: 2
            }}
          >
            <IconButton 
              sx={{ 
                backgroundColor: 'secondary.light',
                width: 60,
                height: 60,
                '&:hover': { backgroundColor: 'secondary.main' }
              }}
            >
              <CodeIcon sx={{ fontSize: 30, color: 'white' }} />
            </IconButton>
            <Typography variant="h6" component="div">
              Scratch Editor
            </Typography>
          </CardActionArea>
        </Card>
      </Box>
    </Dialog>
  );
};

export default DestinationModal;