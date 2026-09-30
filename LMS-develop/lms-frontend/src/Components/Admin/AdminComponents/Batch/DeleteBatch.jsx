import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';
import toast from 'react-hot-toast';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

const DeleteBatch = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Delete Batch', path: '/admin-dashboard/delete-batch' },
    ]);
  }, []);

  const fetchBatches = async (search = '', pageNum = 1) => {
   
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/getAllBatches`, {
        params: { search, page: pageNum, limit: 20 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const next = response.data.data || [];
      setBatches((prev) => (pageNum === 1 ? next : [...prev, ...next]));
      setHasMore(Boolean(response.data.hasMore));
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const debouncedFetch = useRef(
    debounce((value) => {
      setBatchPage(1);
      fetchBatches(value, 1);
    }, 350)
  ).current;

  useEffect(() => {
    fetchBatches('', 1);
  }, []);

  const loadBatchDetails = async (batch) => {
    if (!batch) {
      setSelectedBatch(null);
      return;
    }
    setSelectedBatch(batch);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/batchbyId/${batch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedBatch(response.data);
    } catch (error) {
      console.error('Error loading batch details:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedBatch) {
      toast.error('Please select a batch first');
      return;
    }
        
    const ok = window.confirm(`Delete "${selectedBatch.batchName}"? This cannot be undone.`);
    if (!ok) return;
    
    setLoading(true);
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/batch/delete/${selectedBatch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Batch deleted successfully');
      setSelectedBatch(null);
      fetchBatches(inputValue, 1);
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete batch');
    }
    finally{
      setLoading(false);
    }
  };

  const countOf = (key) => selectedBatch?.[key]?.length || 0;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #dbe7dd', borderRadius: '8px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Delete Batch</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Pick a batch, review what is connected to it, and delete only when the record is truly unused.
            </Typography>
          </Box>
          <Chip label="Destructive action" color="warning" variant="outlined" />
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '8px', height: '100%' }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Select Batch</Typography>
              <Autocomplete
                options={batches}
                value={selectedBatch}
                getOptionLabel={(batch) => batch?.batchName || ''}
                onInputChange={(event, value) => {
                  setInputValue(value);
                  debouncedFetch(value);
                }}
                onChange={(event, value) => loadBatchDetails(value)}
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
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: '8px',
                height: '100%',
                backgroundColor: selectedBatch ? '#fff8f2' : '#fafafa',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <WarningAmberIcon color={selectedBatch ? 'warning' : 'disabled'} />
                <Typography variant="h5" fontWeight={800}>Delete Review</Typography>
              </Stack>

              {!selectedBatch ? (
                <Typography color="text.secondary">Select a batch to see its linked people and courses.</Typography>
              ) : (
                <>
                  <Typography variant="h6" fontWeight={800}>{selectedBatch.batchName}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Academic year: {selectedBatch.academicYear || 'Not set'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    <Chip label={`${countOf('students')} students`} />
                    <Chip label={`${countOf('teachers')} teachers`} />
                    <Chip label={`${countOf('courses')} courses`} />
                    <Chip label={`${countOf('quizzes')} quizzes`} />
                  </Stack>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDelete}
                    disabled={loading}
                    sx={{ borderRadius: '8px', px: 4, py: 1.2, fontWeight: 800 }}
                  >
                  { loading ? 'Deleting...' : 'Delete Batch'}
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default DeleteBatch;
