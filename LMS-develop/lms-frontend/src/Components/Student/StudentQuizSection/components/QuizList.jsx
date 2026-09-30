import React, { useEffect, useState } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import QuizCard from './StudentQuizCard';
import axios from 'axios';
import {
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  TablePagination,
  Typography,
  Button,
  TextField,
  Card,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Container,
  InputAdornment,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useNavigate } from 'react-router-dom';
const QuizList = () => {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [totalItem, setTotalitem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  }
  const fetchAllQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/quiz/get-quizzes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: page + 1,
            limit: rowsPerPage,
            sort: "desc",
            status: statusFilter !== "all" ? statusFilter : undefined,
            search: appliedSearch || undefined,

          },
        }
      );

      // console.log("Fetched Quizzes:", response.data.data.quizzes);

      setTotalitem(response.data?.data?.pagination)
      setQuizzes(response.data?.data?.quizzes || []);

      showSnackbar("Quizzes Fetched successfully");
    } catch (error) {
      console.error("Error fetching Questions:", error);
      showSnackbar("Error While Fetching Quizzes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQuizzes();
  }, [page, rowsPerPage, appliedSearch, statusFilter]);

  // fire search on Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      setAppliedSearch(searchTerm.trim());
      setPage(0);
    }
  };

  // fire search on button click
  const handleSearchClick = () => {
    setAppliedSearch(searchTerm.trim());
    setPage(0);
  };

  const getStatusCount = (status) => {
    return quizzes.filter(quiz => quiz.status === status).length;
  };

  if (loading) {
    return (<div className='flex justify-center items-center h-screen text-3xl'>
      <CircularProgress></CircularProgress>
    </div>)
  }
  const filteredQuizzes = quizzes.filter(quiz => quiz.status === "active")
  //  console.log("Quizzes to display:", filteredQuizzes);
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        py: 3,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            mb: 3,
            p: 4,
            borderRadius: 2,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
          }}
        >
          <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-center sm:justify-between">
            {/* <BookOpen className="text-blue-600" size={32} /> */}
            <Typography
              variant="h3"
              fontWeight={900}
              color="text.primary"
            >
              Available Quizzes
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate("/student-dashboard/live-quiz")}
            >
              Join Live Quiz
            </Button>
          </div>
          <Typography
            color="text.secondary"
            mt={1}
          >
            Select a quiz to begin your assessment.
          </Typography>
        </Box>

        {/* Search and Filter */}
        <Card
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            boxShadow: 2,
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <Box
              sx={{
                display: "flex",
                flex: 1,
                gap: 1,
              }}
            >
              <TextField
                fullWidth
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="success"
                onClick={handleSearchClick}
              >
                Search
              </Button>
            </Box>

            {/* Status Filter */}
            <div className="relative">
              <FormControl sx={{ minWidth: 220 }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <Filter size={18} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">
                    All Status ({totalItem?.totalItems})
                  </MenuItem>

                  <MenuItem value="active">
                    Active ({getStatusCount("active")})
                  </MenuItem>

                  <MenuItem value="inactive">
                    Inactive ({getStatusCount("inactive")})
                  </MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
        </Card>

        {/* Quiz Grid */}
        {filteredQuizzes.length > 0 ? (
          <Grid container spacing={3}>
            {filteredQuizzes.map((quiz) => (
              <Grid item xs={12} sm={6} lg={4} key={quiz._id}>
                <QuizCard quiz={quiz} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Card
            sx={{
              p: 5,
              textAlign: "center",
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
            }}
          >
            <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No quizzes found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>

          </Card>
        )}
        <Box mt={2}>
          <TablePagination
            rowsPerPageOptions={[10, 20, 30, 40]}
            component="div"
            count={totalItem?.totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Container>


      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          icon={
            snackbarSeverity === "success" ? (
              <CheckCircleOutlineIcon fontSize="inherit" />
            ) : undefined
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuizList;
