import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const TeacherLabActivity = () => {
  return (
    <Container
      maxWidth="sm"
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box textAlign="center">
        <Typography variant="h3" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Stay tuned!
        </Typography>
      </Box>
    </Container>
  );
};

export default TeacherLabActivity;
