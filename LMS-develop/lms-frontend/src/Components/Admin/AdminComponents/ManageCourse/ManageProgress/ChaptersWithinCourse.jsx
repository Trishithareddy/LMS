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

const ChaptersWithinCourse = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const courseName = location.state?.courseName;
  
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [searchTags, setSearchTags] = useState({});
  const [currentField, setCurrentField] = useState("chapterName");
  const [currentInput, setCurrentInput] = useState("");
  const [page, setPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const token = localStorage.getItem("token");
  const chaptersPerPage = 10;

  useEffect(() => {
    fetchChapters();
  }, [courseId]);

  const fetchChapters = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/getChaptersForACourse/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      
      
      if (response.data && Array.isArray(response.data.data.chapters)) {
        setChapters(response.data.data.chapters);        
      } else {
        setChapters([]);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
      setErrorMessage("Error fetching chapters from the server.");
    }
  };
  
  const handleNextPage = () => {
    if ((page + 1) * chaptersPerPage < filteredChapters.length) {
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

  const filteredChapters = useMemo(() => {
    return chapters.filter((chapter) => {
      return Object.entries(searchTags).every(([field, tags]) => {
        if (tags.length === 0) return true;
        const chapterValue = chapter[field] || "";
        return tags.some((tag) =>
          chapterValue.toString().toLowerCase().includes(tag.toLowerCase())
        );
      });
    });
  }, [chapters, searchTags]);

  const paginatedChapters = useMemo(() => {
    const startIndex = page * chaptersPerPage;
    return filteredChapters.slice(startIndex, startIndex + chaptersPerPage);
  }, [filteredChapters, page]);
 
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          <b>{courseName}</b> - Chapters
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
                <MenuItem value="chapterName">Chapter Name</MenuItem>
                <MenuItem value="chapterId">Chapter ID</MenuItem>
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

        {/* Chapters Table */}
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <StyledTableCell>Chapter Name</StyledTableCell>
                <StyledTableCell>Chapter ID</StyledTableCell>
                <StyledTableCell>Expected Time</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedChapters.map((chapter) => (
                <StyledTableRow key={chapter.chapterId}>
                  <CompactTableCell>{chapter.name}</CompactTableCell>
                  <CompactTableCell>{chapter.chapterId}</CompactTableCell>
                  <CompactTableCell>{chapter.chapterExpectedtime + chapter.EbookExpectedtime +chapter.videoExpectedtime} secs</CompactTableCell>
                  <CompactTableCell>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => {
                        
                        navigate(`/admin-dashboard/chapterDetails/${chapter._id}`, {
                          state: { chapterId: chapter.chapterId, chapterName: chapter.chapterName },
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
            Page {page + 1} of {Math.ceil(filteredChapters.length / chaptersPerPage)}
          </Typography>
          <IconButton onClick={handleNextPage} disabled={(page + 1) * chaptersPerPage >= filteredChapters.length}>
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

export default ChaptersWithinCourse;
