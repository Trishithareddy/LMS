import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';
import toast from 'react-hot-toast';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

const UpdateBatch = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [formData, setFormData] = useState({
    batchName: '',
    academicYear: '',
    image: null,
  });
  const [inputValue, setInputValue] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null); // blob url for newly selected file
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Update Batch', path: '/admin-dashboard/update-batch' },
    ]);
  }, []);

  // Cleanup blob preview on unmount or change, to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Cancel any in-flight request if component unmounts mid-request
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
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
      toast.error('Failed to load batches');
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
    return () => debouncedFetch.cancel(); // prevent stale debounced call after unmount
  }, []);

  const selectedMeta = useMemo(() => {
    if (!selectedBatch) return null;
    return {
      students: selectedBatch.students?.length || 0,
      teachers: selectedBatch.teachers?.length || 0,
      courses: selectedBatch.courses?.length || 0,
    };
  }, [selectedBatch]);

  const resetImageState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadBatchDetails = async (batch) => {
    resetImageState();

    if (!batch) {
      setSelectedBatch(null);
      setFormData({ batchName: '', academicYear: '', image: null });
      return;
    }

    setSelectedBatch(batch);
    setFormData({
      batchName: batch.batchName || '',
      academicYear: batch.academicYear || '',
      image: null,
    });

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/batchbyId/${batch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedBatch(response.data);
      setFormData({
        batchName: response.data.batchName || '',
        academicYear: response.data.academicYear || '',
        image: null,
      });
    } catch (error) {
      console.error('Error loading batch:', error);
      toast.error('Failed to load full batch details');
      // Keep the lightweight data already set above as fallback — UI stays usable
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFormData((prev) => ({ ...prev, image: file }));
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemoveNewImage = () => {
    // Only clears the newly staged file/preview, reverts to existing batch image
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFormData((prev) => ({ ...prev, image: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) {
      toast.error('Please select a batch first');
      return;
    }
    if (isSubmitting) return; // guard against double submit

    const data = new FormData();
    data.append('batchName', formData.batchName);
    data.append('academicYear', formData.academicYear);
    if (formData.image) data.append('image', formData.image);

    abortControllerRef.current = new AbortController();
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/batch/update/${selectedBatch._id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          signal: abortControllerRef.current.signal,
        }
      );
      toast.success('Batch updated successfully');
      setSelectedBatch(response.data.batch);
      resetImageState();
      fetchBatches(inputValue, 1);
    } catch (error) {
      if (axios.isCancel(error)) return; // silent, request was intentionally aborted
      console.error(error);
      const message = error.response?.data?.message || 'Failed to update batch';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedImageUrl = previewUrl || selectedBatch?.imageUrl  || null;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #dbe7dd', borderRadius: '8px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Manage Batch</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Search a batch, review its attached people and courses, then update only the batch details.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${batches.length} loaded`} variant="outlined" color="success" />
            <Chip label="Edit access" variant="outlined" />
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '8px', height: '100%' }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Select Batch</Typography>
              <Autocomplete
                options={batches}
                value={selectedBatch}
                getOptionLabel={(batch) => batch?.batchName || ''}
                isOptionEqualToValue={(option, value) => option._id === value._id}
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

              {selectedBatch && (
                <Stack spacing={1} sx={{ mt: 3 }}>
                  <Chip label={`${selectedMeta?.students || 0} students`} />
                  <Chip label={`${selectedMeta?.teachers || 0} teachers`} />
                  <Chip label={`${selectedMeta?.courses || 0} courses`} />
                </Stack>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '8px' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <EditIcon color="success" />
                <Typography variant="h5" fontWeight={800}>Batch Details</Typography>
              </Stack>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      required
                      disabled={!selectedBatch}
                      label="Batch Name"
                      name="batchName"
                      value={formData.batchName}
                      onChange={handleChange}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      disabled={!selectedBatch}
                      label="Academic Year"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleChange}
                      sx={fieldSx}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      component="label"
                      disabled={!selectedBatch}
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{ borderRadius: '8px', borderStyle: 'dashed', textTransform: 'none' }}
                    >
                      {formData.image ? formData.image.name : 'Replace batch image'}
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </Grid>

                  {displayedImageUrl && (
                    <Grid item xs={12}>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {previewUrl ? 'New image (not yet saved)' : 'Current image'}
                        </Typography>
                        <Box
                          sx={{
                            position: 'relative',
                            width: 160,
                            height: 160,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #dbe7dd',
                          }}
                        >
                          <Box
                            component="img"
                            src={displayedImageUrl}
                            alt="Batch"
                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {previewUrl && (
                            <IconButton
                              size="small"
                              onClick={handleRemoveNewImage}
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Stack>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      disabled={!selectedBatch || isSubmitting}
                      variant="contained"
                      color="success"
                      sx={{ borderRadius: '8px', px: 4, py: 1.2, fontWeight: 800 }}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Batch'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default UpdateBatch;