import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
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
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

const DeassignCourses = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchCourses, setBatchCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Deassign Courses', path: '/admin-dashboard/deassign-Courses' },
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

  const fetchBatchCourses = async (batch) => {
    if (!batch) {
      setSelectedBatch(null);
      setBatchCourses([]);
      setSelectedCourses([]);
      return;
    }

    setSelectedBatch(batch);
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/batchbyId/${batch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatchCourses(response.data.courses || []);
      setSelectedCourses([]);
    } catch (error) {
      console.error('Error fetching batch courses:', error);
      setErrorMessage('Error fetching batch courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatchCourses = useMemo(() => {
    const term = courseSearch.trim().toLowerCase();
    if (!term) return batchCourses;
    return batchCourses.filter((course) =>
      [course.name, course.description].some((value) => value?.toLowerCase().includes(term))
    );
  }, [batchCourses, courseSearch]);

  const handleCourseToggle = (courseId) => {
    setSelectedCourses((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
  };

  const handleDeassign = async () => {
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
        `${import.meta.env.VITE_API_URL}/admin/batch/deassign-courses`,
        { batchId: selectedBatch._id, courseIds: selectedCourses },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Courses deassigned from batch successfully');
      fetchBatchCourses(selectedBatch);
    } catch (error) {
      console.error('Error deassigning courses from batch:', error);
      setErrorMessage(`Error deassigning courses from batch: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #dbe7dd', borderRadius: '8px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Remove Courses</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Select a batch and remove only the courses that should no longer be available there.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={selectedBatch?.batchName || 'No batch selected'} variant="outlined" color={selectedBatch ? 'success' : 'default'} />
            <Chip label={`${selectedCourses.length} selected`} color={selectedCourses.length ? 'warning' : 'default'} />
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
                onChange={(event, newValue) => fetchBatchCourses(newValue || null)}
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
                color="error"
                onClick={handleDeassign}
                disabled={!selectedBatch || selectedCourses.length === 0 || loading}
                sx={{ mt: 3, borderRadius: '8px', py: 1.2, fontWeight: 800 }}
              >
                Remove Selected Courses
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search assigned courses..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Chip label={`${filteredBatchCourses.length} assigned`} variant="outlined" />
            </Stack>

            {loading ? (
              <Box display="flex" justifyContent="center" py={6}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredBatchCourses.map((course) => {
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
                          borderColor: selected ? '#ef6c00' : '#dbe7dd',
                          backgroundColor: selected ? '#fff7ed' : '#fff',
                          height: '100%',
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <Checkbox checked={selected} sx={{ p: 0.5 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LibraryBooksIcon color="success" fontSize="small" />
                              <Typography fontWeight={800} noWrap>{course.name}</Typography>
                              {selected && <RemoveCircleIcon color="warning" fontSize="small" />}
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

            {!loading && selectedBatch && filteredBatchCourses.length === 0 && (
              <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: '8px' }}>
                <Typography fontWeight={800}>No assigned courses found</Typography>
                <Typography color="text.secondary">This batch has no matching courses to remove.</Typography>
              </Paper>
            )}
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

export default DeassignCourses;
