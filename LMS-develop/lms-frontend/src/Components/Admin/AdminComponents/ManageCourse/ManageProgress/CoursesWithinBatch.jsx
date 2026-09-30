import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.success.main,
  color: theme.palette.common.white,
  textAlign: "center",
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const CompactTableCell = styled(TableCell)({
  padding: "8px",
  textAlign: "center",
});

const CoursesWithinBatch = () => {
    const location = useLocation();
    const batchName = location.state?.batchName;
    
    const { batchId } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("courseName");
    const [currentInput, setCurrentInput] = useState("");
    const [page, setPage] = useState(0);
    const [errorMessage, setErrorMessage] = useState("");
    const token = localStorage.getItem("token");
    const coursesPerPage = 10;
  
    useEffect(() => {
      fetchCourses();
    }, [batchId]);
  
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/getCoursesForABatch/${batchId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data && Array.isArray(response.data.data.courses)) {
          setCourses(response.data.data.courses);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setErrorMessage("Error fetching courses from the server.");
      }
    };
  
    const handleNextPage = () => {
      if ((page + 1) * coursesPerPage < filteredCourses.length) {
        setPage((prevPage) => prevPage + 1);
      }
    };
  
    const handlePreviousPage = () => {
      if (page > 0) {
        setPage((prevPage) => prevPage - 1);
      }
    };
  
    const handleAddTag = (event) => {
      if (event.key === "Enter" && currentInput.trim() !== "") {
        setSearchTags((prev) => ({
          ...prev,
          [currentField]: [...(prev[currentField] || []), currentInput.trim()],
        }));
        setCurrentInput("");
        setPage(0);
      }
    };
  
    const handleDeleteTag = (field, tagToDelete) => {
      setSearchTags((prev) => ({
        ...prev,
        [field]: prev[field].filter((tag) => tag !== tagToDelete),
      }));
      setPage(0);
    };
  
    const filteredCourses = useMemo(() => {
      return courses.filter((course) => {
        return Object.entries(searchTags).every(([field, tags]) => {
          if (tags.length === 0) return true;
          const courseValue = course[field] || "";
          return tags.some((tag) =>
            courseValue.toString().toLowerCase().includes(tag.toLowerCase())
          );
        });
      });
    }, [courses, searchTags]);
  
    const paginatedCourses = useMemo(() => {
      const startIndex = page * coursesPerPage;
      return filteredCourses.slice(startIndex, startIndex + coursesPerPage);
    }, [filteredCourses, page]);
  
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom align="center">
             <b>{batchName}</b>
          </Typography>
  
          {/* Search Bar */}
          <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
            <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ maxWidth: "600px" }}>
              <Grid item xs={12} sm={4}>
                <Select
                  value={currentField}
                  onChange={(e) => setCurrentField(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="courseName">Course Name</MenuItem>
                  <MenuItem value="courseId">Course ID</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label={`Search by ${currentField}`}
                  variant="outlined"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleAddTag}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
  
          {/* Search Tags */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center", maxWidth: "600px" }}>
              {Object.entries(searchTags).map(([field, tags]) =>
                tags.map((tag) => (
                  <Chip
                    key={`${field}-${tag}`}
                    label={`${field}: ${tag}`}
                    onDelete={() => handleDeleteTag(field, tag)}
                    sx={{ mb: 1 }}
                  />
                ))
              )}
            </Stack>
          </Box>
  
          {/* Courses Table */}
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Course Name</StyledTableCell>
                  <StyledTableCell>Course ID</StyledTableCell>
                  <StyledTableCell>Expected Time</StyledTableCell>
                  <StyledTableCell>Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCourses.map((course) => (
                  <StyledTableRow key={course.courseId}>
                    <CompactTableCell>{course.name}</CompactTableCell>
                    <CompactTableCell>{course.courseId}</CompactTableCell>
                    <CompactTableCell>{course.courseExpectedtime} secs</CompactTableCell>
                    <CompactTableCell>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                      
                          navigate(`/admin-dashboard/chaptersWithinCourse/${course._id}`, {
                            state: { courseId: course._id, courseName: course.name },
                          });
                        }}
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
              Page {page + 1} of {Math.ceil(filteredCourses.length / coursesPerPage)}
            </Typography>
            <IconButton onClick={handleNextPage} disabled={(page + 1) * coursesPerPage >= filteredCourses.length}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>
        </Paper>
  
        {/* Error Snackbar */}
        <Snackbar
          open={!!errorMessage}
          autoHideDuration={6000}
          onClose={() => setErrorMessage("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={() => setErrorMessage("")} severity="error" sx={{ width: "100%" }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Container>
    );
  };
  
 
export default CoursesWithinBatch;
