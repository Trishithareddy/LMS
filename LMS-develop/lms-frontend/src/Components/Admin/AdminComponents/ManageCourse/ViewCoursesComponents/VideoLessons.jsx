import React, { useState, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import axios from 'axios';

const VideoLessons = ({ chapterId }) => {
  const [videoLessons, setVideoLessons] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoLessons = async () => {
      try {
        const token = localStorage.getItem("token");
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/video/chapter/${chapterId}`,{
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
        setVideoLessons(response.data.videoLessons);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching video lessons:", error);
        setError("Failed to load video lessons");
        setLoading(false);
      }
    };

    if (chapterId) {
      fetchVideoLessons();
    }
  }, [chapterId]);

  const handleNextVideo = () => {
    if (currentVideoIndex < videoLessons.length - 1) {
      setCurrentVideoIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex((prevIndex) => prevIndex - 1);
    }
  };

  if (loading) return <div>Loading video lessons...</div>;
  if (error) return <div>{error}</div>;
  if (videoLessons.length === 0) return <div>No video lessons available.</div>;

  return (
    <Box sx={{
      margin: "5px auto",
      width: "100%",
      maxWidth: "100%",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: {
        xs: "0 20px",
        sm: "0 150px",
        md: "0 200px",
      },
      boxSizing: "border-box",
    }}>
      <Box
        dangerouslySetInnerHTML={{
          __html: videoLessons[currentVideoIndex].videoUrl,
        }}
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: "90%" },
          backgroundColor: "black",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      />
      <Box sx={{
        marginTop: 1,
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        maxWidth: { xs: "100%", sm: "90%" },
      }}>
        <IconButton
          onClick={handlePreviousVideo}
          disabled={currentVideoIndex === 0}
          sx={{
            color: "#4CAF50",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              borderColor: "#388E3C",
              color: "#388E3C",
            },
            "&:disabled": {
              opacity: 0.5,
              cursor: "not-allowed",
            },
            transition: "all 0.3s ease",
            padding: "8px",
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <IconButton
          onClick={handleNextVideo}
          disabled={currentVideoIndex === videoLessons.length - 1}
          sx={{
            color: "#4CAF50",
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              borderColor: "#388E3C",
              color: "#388E3C",
            },
            "&:disabled": {
              opacity: 0.5,
              cursor: "not-allowed",
            },
            transition: "all 0.3s ease",
            padding: "8px",
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default VideoLessons;