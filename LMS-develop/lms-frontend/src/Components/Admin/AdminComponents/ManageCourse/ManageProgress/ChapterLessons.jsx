import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Box, Button, Container, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LessonSlides from "./LessonSlides"; // Import LessonSlides component

// Styled components for table cell and row
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  textAlign: "center", // Center align for header
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const CompactTableCell = styled(TableCell)({
  padding: "8px",
  textAlign: "center", // Center align for body cells
});

const ChapterLessons = () => {
  const { chapterId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Track changes
  const [selectedLessonId, setSelectedLessonId] = useState(null); // Track the selected lesson
  const [page, setPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const lessonsPerPage = 10;

  useEffect(() => {
    fetchLessons();
  }, [chapterId]);

  // Fetch lessons for the chapter
  const fetchLessons = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/getAllLessonsFromAChapter/${chapterId}`);
      if (response.data && response.data.success) {
        setLessons(response.data.data);
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
      setErrorMessage("Error fetching lessons from the server.");
    }
  };

  const handleNextPage = () => {
    if ((page + 1) * lessonsPerPage < lessons.length) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 0) {
      setPage((prevPage) => prevPage - 1);
    }
  };

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1); // Increment to trigger useEffect
  };
  
  useEffect(() => {
    fetchLessons(); // Re-fetch lessons whenever refreshTrigger changes
  }, [refreshTrigger]);
  // Paginate lessons based on page state
  const paginatedLessons = lessons.slice(page * lessonsPerPage, (page + 1) * lessonsPerPage);

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Lessons in Chapter
        </Typography>

        {/* Lessons Table */}
        <TableContainer component={Paper} sx={{ mb: 3, tableLayout: "fixed" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell>Lesson Name</StyledTableCell>
                <StyledTableCell>Expected Time (secs)</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLessons.map((lesson) => (
                <StyledTableRow key={lesson._id}>
                  <CompactTableCell>{lesson.lessonName}</CompactTableCell>
                  <CompactTableCell>{lesson.lessonExpectedtime}</CompactTableCell>
                  <CompactTableCell>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => setSelectedLessonId(lesson._id)} // Set selected lesson ID
                    >
                      Go
                    </Button>
                  </CompactTableCell>
                </StyledTableRow>
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
            Page {page + 1} of {Math.ceil(lessons.length / lessonsPerPage)}
          </Typography>
          <IconButton onClick={handleNextPage} disabled={(page + 1) * lessonsPerPage >= lessons.length}>
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>

        {/* Error Snackbar */}
        {errorMessage && (
          <Typography color="error" align="center" mt={2}>
            {errorMessage}
          </Typography>
        )}
      </Paper>

      {/* Conditionally render LessonSlides */}
      {selectedLessonId && <LessonSlides lessonId={selectedLessonId} triggerRefresh={triggerRefresh} />}
    </Container>
  );
};

export default ChapterLessons;
