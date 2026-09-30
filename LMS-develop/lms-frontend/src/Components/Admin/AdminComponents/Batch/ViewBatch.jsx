import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';

const cardSx = {
  p: 2.5,
  borderRadius: '8px',
  border: '1px solid #dbe7dd',
  height: '100%',
  backgroundColor: '#fff',
};

const ViewBatch = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [batches, setBatches] = useState([]);
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const token = localStorage.getItem('token');
  const itemsPerPage = 30;

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'View Batch', path: '/admin-dashboard/view-batch' },
    ]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/get-All-Batches`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: itemsPerPage,
          ...(debouncedQuery && { q: debouncedQuery }),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      if (response.data.success) {
        setBatches(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 0);
        setTotalBatches(response.data.pagination?.totalBatches || 0);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to fetch batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedQuery, token]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const fetchBatchDetails = async (batchId) => {
    if (expandedBatch === batchId) {
      setExpandedBatch(null);
      return;
    }

    const existing = batches.find((batch) => batch._id === batchId);
    if (existing?.details) {
      setExpandedBatch(batchId);
      return;
    }

    setDetailsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/batchbyId/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBatches((prev) =>
        prev.map((batch) => (batch._id === batchId ? { ...batch, details: response.data } : batch))
      );
      setExpandedBatch(batchId);
    } catch (err) {
      console.error('Error fetching batch details:', err);
      setError('Failed to fetch batch details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const makePrimary = async (batchId, teacherId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/batch/${batchId}/change-primary`,
        { teacherId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBatches((prev) => prev.map((batch) => (batch._id === batchId ? { ...batch, details: null } : batch)));
      setExpandedBatch(null);
      fetchBatchDetails(batchId);
    } catch (err) {
      console.error('Error changing primary teacher:', err);
    }
  };

  const countOf = (batch, key) => batch.details?.[key]?.length || batch[key]?.length || 0;

  const getTeacher = (item) => item?.teacher || item;
  const getRole = (item) => item?.role || item?.teacher?.role || '';
  const itemName = (item) => (typeof item === 'object' ? item?.name || item?.username || item?._id : item);

  const renderDetails = (batch) => {
    const details = batch.details;
    if (!details) return null;

    const courses = details.courses || [];
    const students = details.students || [];
    const teachers = details.teachers || [];

    return (
      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e5ece6' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={800}>Courses</Typography>
            <List dense sx={{ overflow: 'hidden' }}>
              {courses.slice(0, 6).map((course) => (
                <ListItem key={course._id || course} disableGutters>
                  <ListItemText
                    primary={itemName(course)}
                    secondary={course.description}
                    primaryTypographyProps={{ fontWeight: 700, sx: { overflowWrap: 'anywhere' } }}
                    secondaryTypographyProps={{
                      sx: {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      },
                    }}
                  />
                </ListItem>
              ))}
              {courses.length === 0 && <Typography color="text.secondary">No courses assigned</Typography>}
            </List>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={800}>Students</Typography>
            <List dense>
              {students.slice(0, 6).map((student) => (
                <ListItem key={student._id || student} disableGutters>
                  <ListItemText
                    primary={itemName(student)}
                    secondary={[student.class, student.section, student.school?.name].filter(Boolean).join(' | ')}
                    primaryTypographyProps={{ fontWeight: 700, sx: { overflowWrap: 'anywhere' } }}
                  />
                </ListItem>
              ))}
              {students.length === 0 && <Typography color="text.secondary">No students assigned</Typography>}
            </List>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={800}>Teachers</Typography>
            <List dense sx={{ overflow: 'hidden' }}>
              {teachers.slice(0, 6).map((teacherItem) => {
                const teacher = getTeacher(teacherItem);
                const role = getRole(teacherItem);
                return (
                  <ListItem
                    key={teacher?._id || teacherItem._id || teacherItem}
                    disableGutters
                    sx={{ alignItems: 'flex-start', display: 'block', py: 0.75 }}
                  >
                    <Stack spacing={0.75}>
                      <ListItemText
                        primary={itemName(teacher)}
                        secondary={teacher?.username || role || ''}
                        primaryTypographyProps={{ fontWeight: 700, sx: { overflowWrap: 'anywhere' } }}
                        secondaryTypographyProps={{ sx: { overflowWrap: 'anywhere' } }}
                        sx={{ m: 0 }}
                      />
                      {role === 'PRIMARY' ? (
                        <Chip icon={<StarIcon />} label="Primary" size="small" color="success" sx={{ width: 'fit-content' }} />
                      ) : teacher?._id ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => makePrimary(batch._id, teacher._id)}
                          sx={{ width: 'fit-content', borderRadius: '8px' }}
                        >
                          Make Primary
                        </Button>
                      ) : null}
                    </Stack>
                  </ListItem>
                );
              })}
              {teachers.length === 0 && <Typography color="text.secondary">No teachers assigned</Typography>}
            </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const handlePageChange = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setCurrentPage(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #dbe7dd', borderRadius: '8px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Batch Records</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Browse batches, inspect assigned courses, and quickly verify student and teacher coverage.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${totalBatches || 0} batches`} variant="outlined" color="success" />
            <Chip label={`${batches.length} shown`} variant="outlined" />
          </Stack>
        </Stack>

        <TextField
          fullWidth
          placeholder="Search batches by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            maxWidth: 620,
            mb: 3,
            '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#fff' },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: '#ffcdd2', backgroundColor: '#fff5f5' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {batches.map((batch) => (
              <Grid item xs={12} md={expandedBatch === batch._id ? 12 : 6} xl={expandedBatch === batch._id ? 12 : 4} key={batch._id}>
                <Paper variant="outlined" sx={cardSx}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '8px',
                        backgroundColor: '#eaf7ee',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#0b7a2a',
                        flex: '0 0 auto',
                      }}
                    >
                      <GroupsIcon />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" fontWeight={800} noWrap>
                        {batch.batchName}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                        Batch ID: {batch.batchId || 'Not set'}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => fetchBatchDetails(batch._id)}>
                      <ExpandMoreIcon
                        sx={{
                          transform: expandedBatch === batch._id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 160ms ease',
                        }}
                      />
                    </IconButton>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    <Chip label={`${countOf(batch, 'students')} students`} size="small" />
                    <Chip label={`${countOf(batch, 'teachers')} teachers`} size="small" />
                    <Chip label={`${countOf(batch, 'courses')} courses`} size="small" color="success" variant="outlined" />
                  </Stack>

                  <Collapse in={expandedBatch === batch._id} timeout="auto" unmountOnExit>
                    {detailsLoading && expandedBatch === batch._id ? (
                      <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      renderDetails(batch)
                    )}
                  </Collapse>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && batches.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: '8px' }}>
            <Typography variant="h6" fontWeight={800}>No batches found</Typography>
            <Typography color="text.secondary">Try another search term.</Typography>
          </Paper>
        )}

        {totalPages > 1 && (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 4 }}>
            <IconButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography>Page {currentPage} of {totalPages}</Typography>
            <IconButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              <ArrowForwardIosIcon />
            </IconButton>
          </Stack>
        )}
      </Paper>
    </Container>
  );
};

export default ViewBatch;
