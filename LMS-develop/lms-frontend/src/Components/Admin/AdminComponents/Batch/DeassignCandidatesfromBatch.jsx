import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
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
  IconButton,
  InputAdornment,
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import debounce from 'lodash.debounce';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';

const HeadCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 800,
  backgroundColor: '#fff7ed',
  color: theme.palette.text.primary,
  borderBottom: '1px solid #ffe0bd',
}));

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

const itemsPerPage = 50;

const DeassignCandidatesFromBatch = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [studentPage, setStudentPage] = useState(0);
  const [teacherPage, setTeacherPage] = useState(0);
  const [studentSearchTags, setStudentSearchTags] = useState({});
  const [teacherSearchTags, setTeacherSearchTags] = useState({});
  const [currentStudentField, setCurrentStudentField] = useState('name');
  const [currentTeacherField, setCurrentTeacherField] = useState('name');
  const [currentStudentInput, setCurrentStudentInput] = useState('');
  const [currentTeacherInput, setCurrentTeacherInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Deassign Candidates', path: '/admin-dashboard/deassign-Candidates' },
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

  const fetchBatchDetails = async (batch) => {
    if (!batch) {
      setSelectedBatch(null);
      setStudents([]);
      setTeachers([]);
      setSelectedStudents([]);
      setSelectedTeachers([]);
      return;
    }

    setSelectedBatch(batch);
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/batchbyId/${batch._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(response.data.students || []);
      const teacherList = (response.data.teachers || [])
        .map((item) => {
          const teacher = item.teacher || item;
          if (!teacher?._id && !teacher?.name) return null;
          return {
            ...teacher,
            role: item.role || teacher.role,
          };
        })
        .filter(Boolean);
      setTeachers(teacherList);
      setSelectedStudents([]);
      setSelectedTeachers([]);
      setStudentPage(0);
      setTeacherPage(0);
    } catch (error) {
      console.error('Error fetching batch details:', error);
      setErrorMessage('Error fetching batch details');
    } finally {
      setLoading(false);
    }
  };

  const matchesTags = (item, tags) => {
    return Object.entries(tags).every(([field, values]) => {
      if (!values.length) return true;
      const value = field === 'schoolName' || field === 'school' ? item.school?.name : item[field];
      return values.some((tag) => (value || '').toString().toLowerCase().includes(tag.toLowerCase()));
    });
  };

  const filteredStudents = useMemo(
    () => students.filter((student) => matchesTags(student, studentSearchTags)),
    [students, studentSearchTags]
  );

  const filteredTeachers = useMemo(
    () => teachers.filter((teacher) => matchesTags(teacher, teacherSearchTags)),
    [teachers, teacherSearchTags]
  );

  const addTag = (event, type) => {
    if (event.key !== 'Enter' || !event.target.value.trim()) return;
    if (type === 'student') {
      setStudentSearchTags((prev) => ({
        ...prev,
        [currentStudentField]: [...(prev[currentStudentField] || []), event.target.value.trim()],
      }));
      setCurrentStudentInput('');
      setStudentPage(0);
    } else {
      setTeacherSearchTags((prev) => ({
        ...prev,
        [currentTeacherField]: [...(prev[currentTeacherField] || []), event.target.value.trim()],
      }));
      setCurrentTeacherInput('');
      setTeacherPage(0);
    }
  };

  const deleteTag = (field, tag, type) => {
    const setter = type === 'student' ? setStudentSearchTags : setTeacherSearchTags;
    setter((prev) => ({ ...prev, [field]: prev[field].filter((item) => item !== tag) }));
  };

  const renderFilters = (type) => {
    const isStudent = type === 'student';
    const fields = isStudent ? ['name', 'username', 'schoolName', 'class', 'section'] : ['name', 'username', 'schoolName'];
    const field = isStudent ? currentStudentField : currentTeacherField;
    const setField = isStudent ? setCurrentStudentField : setCurrentTeacherField;
    const input = isStudent ? currentStudentInput : currentTeacherInput;
    const setInput = isStudent ? setCurrentStudentInput : setCurrentTeacherInput;
    const tags = isStudent ? studentSearchTags : teacherSearchTags;

    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Select value={field} onChange={(e) => setField(e.target.value)} size="small" sx={{ minWidth: 150, ...fieldSx }}>
            {fields.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </Select>
          <TextField
            fullWidth
            size="small"
            placeholder={`Search ${type}s and press Enter`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => addTag(e, type)}
            sx={fieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(tags).flatMap(([tagField, values]) =>
            values.map((tag) => (
              <Chip key={`${type}-${tagField}-${tag}`} label={`${tagField}: ${tag}`} onDelete={() => deleteTag(tagField, tag, type)} size="small" />
            ))
          )}
        </Stack>
      </Box>
    );
  };

  const toggleStudent = (id) => {
    setSelectedStudents((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleTeacher = (id) => {
    setSelectedTeachers((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleDeassign = async () => {
    if (!selectedBatch) {
      setErrorMessage('Please select a batch');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/batch/deassign`,
        { batchId: selectedBatch._id, studentIds: selectedStudents, teacherIds: selectedTeachers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Deassigned from batch successfully');
      fetchBatchDetails(selectedBatch);
    } catch (error) {
      console.error('Error deassigning candidates from batch:', error);
      setErrorMessage('Error deassigning candidates from batch');
    } finally {
      setLoading(false);
    }
  };

  const studentRows = filteredStudents.slice(studentPage * itemsPerPage, (studentPage + 1) * itemsPerPage);
  const teacherRows = filteredTeachers.slice(teacherPage * itemsPerPage, (teacherPage + 1) * itemsPerPage);
  const studentPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const teacherPages = Math.max(1, Math.ceil(filteredTeachers.length / itemsPerPage));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #dbe7dd', borderRadius: '8px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Remove People</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Select a batch, then remove students or teachers from that batch only.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${selectedStudents.length} students`} color={selectedStudents.length ? 'warning' : 'default'} />
            <Chip label={`${selectedTeachers.length} teachers`} color={selectedTeachers.length ? 'warning' : 'default'} />
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
                onChange={(event, value) => fetchBatchDetails(value || null)}
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
                startIcon={<PersonRemoveIcon />}
                onClick={handleDeassign}
                disabled={!selectedBatch || (selectedStudents.length === 0 && selectedTeachers.length === 0) || loading}
                sx={{ mt: 3, borderRadius: '8px', py: 1.2, fontWeight: 800 }}
              >
                Remove Selected People
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            {!selectedBatch ? (
              <Paper variant="outlined" sx={{ p: 4, borderRadius: '8px', textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={800}>Select a batch to view assigned members</Typography>
                <Typography color="text.secondary">Students and teachers will appear here after batch selection.</Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="h5" fontWeight={800}>Students in Batch</Typography>
                        <Typography color="text.secondary">{filteredStudents.length} matching students</Typography>
                      </Box>
                      <Chip label={`${selectedStudents.length} selected`} color={selectedStudents.length ? 'warning' : 'default'} />
                    </Stack>
                    {renderFilters('student')}
                    {loading ? (
                      <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <HeadCell padding="checkbox">
                                <Checkbox
                                  checked={studentRows.length > 0 && studentRows.every((student) => selectedStudents.includes(student._id))}
                                  indeterminate={studentRows.some((student) => selectedStudents.includes(student._id)) && !studentRows.every((student) => selectedStudents.includes(student._id))}
                                  onChange={(e) => setSelectedStudents(e.target.checked ? studentRows.map((student) => student._id) : [])}
                                />
                              </HeadCell>
                              <HeadCell>Name</HeadCell>
                              <HeadCell>Username</HeadCell>
                              <HeadCell>School</HeadCell>
                              <HeadCell>Class</HeadCell>
                              <HeadCell>Section</HeadCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {studentRows.map((student) => (
                              <TableRow key={student._id} hover>
                                <TableCell padding="checkbox">
                                  <Checkbox checked={selectedStudents.includes(student._id)} onChange={() => toggleStudent(student._id)} />
                                </TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.username}</TableCell>
                                <TableCell>{student.school?.name || 'N/A'}</TableCell>
                                <TableCell>{student.class || 'N/A'}</TableCell>
                                <TableCell>{student.section || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                      <IconButton onClick={() => setStudentPage((prev) => Math.max(0, prev - 1))} disabled={studentPage === 0}>
                        <ArrowBackIosNewIcon />
                      </IconButton>
                      <Typography>Page {studentPage + 1} of {studentPages}</Typography>
                      <IconButton onClick={() => setStudentPage((prev) => prev + 1)} disabled={(studentPage + 1) * itemsPerPage >= filteredStudents.length}>
                        <ArrowForwardIosIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="h5" fontWeight={800}>Teachers in Batch</Typography>
                        <Typography color="text.secondary">Removing primary will promote another teacher automatically.</Typography>
                      </Box>
                      <Chip label={`${selectedTeachers.length} selected`} color={selectedTeachers.length ? 'warning' : 'default'} />
                    </Stack>
                    {renderFilters('teacher')}
                    {loading ? (
                      <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <HeadCell padding="checkbox">
                                <Checkbox
                                  checked={teacherRows.length > 0 && teacherRows.every((teacher) => selectedTeachers.includes(teacher._id))}
                                  indeterminate={teacherRows.some((teacher) => selectedTeachers.includes(teacher._id)) && !teacherRows.every((teacher) => selectedTeachers.includes(teacher._id))}
                                  onChange={(e) => setSelectedTeachers(e.target.checked ? teacherRows.map((teacher) => teacher._id) : [])}
                                />
                              </HeadCell>
                              <HeadCell>Name</HeadCell>
                              <HeadCell>Username</HeadCell>
                              <HeadCell>School</HeadCell>
                              <HeadCell>Role</HeadCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {teacherRows.map((teacher) => (
                              <TableRow key={teacher._id} hover>
                                <TableCell padding="checkbox">
                                  <Checkbox checked={selectedTeachers.includes(teacher._id)} onChange={() => toggleTeacher(teacher._id)} />
                                </TableCell>
                                <TableCell>{teacher.name}</TableCell>
                                <TableCell>{teacher.username}</TableCell>
                                <TableCell>{teacher.school?.name || 'N/A'}</TableCell>
                                <TableCell>
                                  <Chip label={teacher.role === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY'} size="small" color={teacher.role === 'PRIMARY' ? 'success' : 'default'} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                    <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                      <IconButton onClick={() => setTeacherPage((prev) => Math.max(0, prev - 1))} disabled={teacherPage === 0}>
                        <ArrowBackIosNewIcon />
                      </IconButton>
                      <Typography>Page {teacherPage + 1} of {teacherPages}</Typography>
                      <IconButton onClick={() => setTeacherPage((prev) => prev + 1)} disabled={(teacherPage + 1) * itemsPerPage >= filteredTeachers.length}>
                        <ArrowForwardIosIcon />
                      </IconButton>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
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

export default DeassignCandidatesFromBatch;
