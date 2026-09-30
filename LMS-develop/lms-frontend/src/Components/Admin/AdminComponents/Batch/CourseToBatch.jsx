import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

const CourseToBatch = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(24);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Assign Courses', path: '/admin-dashboard/assign-courses-to-batch' },
    ]);
  }, []);

  const fetchBatches = async (search = '', pageNum = 1) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/getAllBatches`, {
        params: { search, page: pageNum, limit: 20 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const next = res.data.data || [];
      setBatches((prev) => (pageNum === 1 ? next : [...prev, ...next]));
      setHasMore(Boolean(res.data.hasMore));
    } catch (err) {
      console.error(err);
    }
  };

  const debouncedFetch = useRef(
    debounce((value) => {
      setBatchPage(1);
      fetchBatches(value, 1);
    }, 400)
  ).current;

  useEffect(() => {
    fetchBatches('', 1);
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (courseSearch.trim()) params.set('name', courseSearch.trim());

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/courses/getAllCourses?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCourses(response.data?.data || []);
      setTotalCount(response.data?.pagination?.totalDocuments || 0);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setErrorMessage('Error fetching courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchCourses, 250);
    return () => clearTimeout(timer);
  }, [page, rowsPerPage, courseSearch]);

  const handleAssign = async () => {
    if (!selectedBatch) {
      setErrorMessage('Please select a batch');
      return;
    }

    if (selectedCourses.length === 0) {
      setErrorMessage('Please select at least one course');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/batch/assign-courses`,
        { batchId: selectedBatch._id, courseIds: selectedCourses },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Courses assigned to batch successfully');
      setSelectedBatch(null);
      setSelectedCourses([]);
    } catch (error) {
      console.error('Error assigning courses to batch:', error);
      setErrorMessage(`Error assigning courses to batch: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (courseId) => {
    setSelectedCourses((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #dbe7dd', borderRadius: '8px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Assign Courses</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Choose a batch and attach one or more courses without scanning a long table.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={selectedBatch?.batchName || 'No batch selected'} color={selectedBatch ? 'success' : 'default'} variant="outlined" />
            <Chip label={`${selectedCourses.length} selected`} color={selectedCourses.length ? 'success' : 'default'} />
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '8px', position: { md: 'sticky' }, top: 16 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Target Batch</Typography>
              <Autocomplete
                options={batches}
                value={selectedBatch}
                getOptionLabel={(b) => b?.batchName || ''}
                onInputChange={(event, value) => {
                  setInputValue(value);
                  debouncedFetch(value);
                }}
                onChange={(event, newValue) => setSelectedBatch(newValue || null)}
                ListboxProps={{
                  onScroll: (event) => {
                    const listbox = event.currentTarget;
                    if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 10 && hasMore) {
                      const nextPage = batchPage + 1;
                      setBatchPage(nextPage);
                      fetchBatches(inputValue, nextPage);
                    }
                  },
                }}
                renderInput={(params) => <TextField {...params} label="Search batch" sx={fieldSx} />}
              />

              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={handleAssign}
                disabled={!selectedBatch || selectedCourses.length === 0 || loading}
                sx={{ mt: 3, borderRadius: '8px', py: 1.2, fontWeight: 800 }}
              >
                Assign Selected Courses
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search courses by name..."
                value={courseSearch}
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  setPage(0);
                }}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Chip label={`${totalCount} courses`} variant="outlined" />
            </Stack>

            {loading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {courses.map((course) => {
                  const selected = selectedCourses.includes(course._id);
                  return (
                    <Grid item xs={12} md={6} key={course._id}>
                      <Paper
                        variant="outlined"
                        onClick={() => handleCourseToggle(course._id)}
                        sx={{
                          p: 2,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          borderColor: selected ? '#2e7d32' : '#dbe7dd',
                          backgroundColor: selected ? '#f0fbf2' : '#fff',
                          height: '100%',
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Checkbox checked={selected} sx={{ p: 0.5 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LibraryBooksIcon color="success" fontSize="small" />
                              <Typography fontWeight={800} noWrap>{course.name}</Typography>
                              {selected && <CheckCircleIcon color="success" fontSize="small" />}
                            </Stack>
                            <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.9rem' }}>
                              {course.description || 'No description added'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[24, 48, 96]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(+event.target.value);
                  setPage(0);
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>{successMessage}</Alert>
      </Snackbar>

      <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={() => setErrorMessage('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>{errorMessage}</Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseToBatch;
