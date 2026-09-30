import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useEffect, useState } from "react";

// Styled components for table cell and row
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  textAlign: "center", // Center align for header
}));

const CompactTableCell = styled(TableCell)({
  padding: "8px",
  textAlign: "center", // Center align for body cells
});

const LessonSlides = ({ lessonId,triggerRefresh }) => {
  const [slides, setSlides] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(0);
  const [editSlideId, setEditSlideId] = useState(null); // Track which slide is being edited
  const [newExpectedTime, setNewExpectedTime] = useState(""); // Store the new expected time
  const slidesPerPage = 3; // Show 3 slides per page

  useEffect(() => {
    fetchLessonSlides();
  }, [lessonId]);

  // Fetch slides for the selected lesson
  const token = localStorage.getItem("token");
  
  const fetchLessonSlides = async () => {
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/getLessonSlides/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        setSlides(response.data.data.slides);
      } else {
        setSlides([]);
      }
    } catch (error) {
      console.error("Error fetching slides:", error);
      setErrorMessage("Error fetching slides from the server.");
    }
  };

  // Get paginated slides
  const paginatedSlides = slides.slice(page * slidesPerPage, (page + 1) * slidesPerPage);

  // Handle Next Page
  const handleNextPage = () => {
    if ((page + 1) * slidesPerPage < slides.length) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Handle Previous Page
  const handlePreviousPage = () => {
    if (page > 0) {
      setPage(prevPage => prevPage - 1);
    }
  };

  // Handle editing the expected time for a slide
  const handleEditTime = (slideId, currentTime) => {
    setEditSlideId(slideId);  // Set the slide ID to edit
    setNewExpectedTime(currentTime);  // Set the current time in the input
  };

  // Handle saving the new expected time
  const handleSaveTime = async (slideId) => {
    try {
      const updatedSlides = slides.map(slide => 
        slide._id === slideId ? { ...slide, expectedTime: newExpectedTime } : slide
      );
  
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/lessons/lessons/${lessonId}`,
        { slides: updatedSlides },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.data && response.data.success) {
        setSlides(updatedSlides);
        setEditSlideId(null);
        setNewExpectedTime("");
  
        triggerRefresh();  // Call function from parent to refresh chapter time
      } else {
        throw new Error(response.data.message || "Failed to update slide time.");
      }
    } catch (error) {
      console.error("Error saving the slide time:", error);
      setErrorMessage(error.response?.data?.message || "Error saving slide time.");
    }
  };
  

  return (
    <Box sx={{ mt: 4 }}>
      {errorMessage && (
        <Typography color="error" align="center" mt={2}>
          {errorMessage}
        </Typography>
      )}

      <Typography variant="h5" gutterBottom>
        Slides for the Lesson
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableCell>Slide Content</StyledTableCell>
              <StyledTableCell>Expected Time (secs)</StyledTableCell>
              <StyledTableCell>Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSlides.map((slide) => (
              <TableRow key={slide._id}>
                <CompactTableCell
                  dangerouslySetInnerHTML={{ __html: slide.content }}
                />
                <CompactTableCell>
                  {editSlideId === slide._id ? (
                    <TextField
                      value={newExpectedTime}
                      onChange={(e) => setNewExpectedTime(e.target.value)}
                      type="number"
                      size="small"
                    />
                  ) : (
                    slide.expectedTime
                  )}
                </CompactTableCell>
                <CompactTableCell>
                  {editSlideId === slide._id ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleSaveTime(slide._id)}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleEditTime(slide._id, slide.expectedTime)}
                    >
                      Edit Time
                    </Button>
                  )}
                </CompactTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
        <IconButton onClick={handlePreviousPage} disabled={page === 0}>
          <ArrowBackIosNewIcon />
        </IconButton>
        <Typography variant="body1" sx={{ mx: 2 }}>
          Page {page + 1} of {Math.ceil(slides.length / slidesPerPage)}
        </Typography>
        <IconButton
          onClick={handleNextPage}
          disabled={(page + 1) * slidesPerPage >= slides.length}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default LessonSlides;
