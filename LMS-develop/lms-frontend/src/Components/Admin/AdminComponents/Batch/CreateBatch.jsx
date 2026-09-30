import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import GroupsIcon from '@mui/icons-material/Groups';
import {
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
import React, { useContext, useEffect, useRef, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';
import toast from 'react-hot-toast';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

const CreateBatch = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [formData, setFormData] = useState({
    batchName: '',
    academicYear: '',
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isloading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Create Batch', path: '/admin-dashboard/create-batch' },
    ]);
  }, []);

  // Cleanup blob URL on unmount or when preview changes, to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;

    // Revoke old preview before creating a new one
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setFormData((prev) => ({ ...prev, image: file }));
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFormData((prev) => ({ ...prev, image: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; // reset actual DOM input
  };

  const resetImageInput = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('batchName', formData.batchName);
    data.append('academicYear', formData.academicYear);
    if (formData.image) data.append('image', formData.image);

    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/batch/create`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Batch created successfully');
      setFormData({ batchName: '', academicYear: '', image: null });
      resetImageInput(); // clears preview + actual file input DOM value
    } catch (error) {
      console.error(error);
      toast.error('Failed to create batch');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          border: '1px solid #dbe7dd',
          borderRadius: '8px',
          backgroundColor: '#fff',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: 0 }}>
              Create Batch
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: '1rem' }}>
              Create a class group once, then assign students, teachers, and courses from batch operations.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="Batch setup" variant="outlined" color="success" />
            <Chip label="Image optional" variant="outlined" />
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: '8px' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <GroupsIcon color="success" />
                <Typography variant="h5" fontWeight={800}>
                  Batch Details
                </Typography>
              </Stack>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      required
                      label="Batch Name"
                      name="batchName"
                      value={formData.batchName}
                      onChange={handleChange}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Academic Year"
                      name="academicYear"
                      placeholder="e.g. 2026-27"
                      value={formData.academicYear}
                      onChange={handleChange}
                      sx={inputSx}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        borderRadius: '8px',
                        borderStyle: 'dashed',
                        px: 2,
                        py: 1.1,
                        textTransform: 'none',
                      }}
                    >
                      {formData.image ? formData.image.name : 'Upload batch image'}
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </Button>
                  </Grid>

                  {previewUrl && (
                    <Grid item xs={12}>
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
                          src={previewUrl}
                          alt="Batch preview"
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          onClick={handleRemoveImage}
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
                      </Box>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      disabled={isloading}
                      sx={{ borderRadius: '8px', px: 4, py: 1.2, fontWeight: 800 }}
                    >
                      {isloading ? 'Creating...' : 'Create Batch'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: '8px', height: '100%', backgroundColor: '#f7fbf8' }}
            >
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Next Steps
              </Typography>
              <Stack spacing={1.2} sx={{ color: 'text.secondary' }}>
                <Typography>1. Assign students and teachers.</Typography>
                <Typography>2. Attach courses to this batch.</Typography>
                <Typography>3. Open batch records to verify members and content.</Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default CreateBatch;