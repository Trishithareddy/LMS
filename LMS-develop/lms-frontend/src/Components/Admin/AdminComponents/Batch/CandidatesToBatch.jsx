import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
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
  Radio,
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
import React, { useContext, useEffect, useRef, useState } from 'react';
import { BreadcrumbContext } from '../../../BreadcrumbContext';

const HeadCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 800,
  backgroundColor: '#f2fbf4',
  color: theme.palette.text.primary,
  borderBottom: '1px solid #d7eadb',
}));

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

const itemsPerPage = 50;

const CandidatesToBatch = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalTeacherCount, setTotalTeacherCount] = useState(0);
  const [primaryTeacherId, setPrimaryTeacherId] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    setBreadcrumbTrail([
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Assign Candidates', path: '/admin-dashboard/assign-candidates-to-batch' },
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

  const buildQueryString = (params) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key].length > 0) searchParams.set(key, params[key].join(','));
    });
    return searchParams.toString();
  };

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const query = buildQueryString(studentSearchTags);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/getAllStudents?page=${studentPage + 1}&limit=${itemsPerPage}&${query}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(response.data.data || []);
        setTotalCount(response.data.totalStudents || 0);
      } catch (error) {
        console.error('Error fetching students:', error);
        setErrorMessage('Error fetching students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [studentPage, studentSearchTags]);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const query = buildQueryString(teacherSearchTags);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/getAllTeachers?page=${teacherPage + 1}&limit=${itemsPerPage}&${query}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeachers(response.data.data || []);
        setTotalTeacherCount(response.data.totalTeachers || 0);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setErrorMessage('Error fetching teachers');
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [teacherPage, teacherSearchTags]);

  useEffect(() => {
    setPrimaryTeacherId(null);
  }, [selectedBatch]);

  const handleAssign = async () => {
    if (!selectedBatch) {
      setErrorMessage('Please select a batch');
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/batch/assign`,
        {
          batchId: selectedBatch._id,
          studentIds: selectedStudents,
          teachers: selectedTeachers.map((id) => ({
            teacherId: id,
            role: id === primaryTeacherId ? 'PRIMARY' : 'SECONDARY',
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Assigned to batch successfully');
      setSelectedBatch(null);
      setSelectedStudents([]);
      setSelectedTeachers([]);
      setPrimaryTeacherId(null);
    } catch (error) {
      console.error('Error assigning candidates to batch:', error);
      setErrorMessage('Error assigning candidates to batch');
    }
  };

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
    const fields = isStudent ? ['name', 'username', 'school', 'class', 'section'] : ['name', 'username', 'school'];
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
    setSelectedTeachers((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (!next.includes(primaryTeacherId)) setPrimaryTeacherId(null);
      return next;
    });
  };

  const studentPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const teacherPages = Math.max(1, Math.ceil(totalTeacherCount / itemsPerPage));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid #dbe7dd', borderRadius: '8px' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h3" fontWeight={800}>Assign People</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Select one batch, then add students and teachers from filtered lists.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label={`${selectedStudents.length} students`} color={selectedStudents.length ? 'success' : 'default'} />
            <Chip label={`${selectedTeachers.length} teachers`} color={selectedTeachers.length ? 'success' : 'default'} />
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
                onChange={(event, value) => setSelectedBatch(value || null)}
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
                startIcon={<PersonAddIcon />}
                onClick={handleAssign}
                disabled={!selectedBatch || (selectedStudents.length === 0 && selectedTeachers.length === 0)}
                sx={{ mt: 3, borderRadius: '8px', py: 1.2, fontWeight: 800 }}
              >
                Assign Selected People
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={800}>Students</Typography>
                      <Typography color="text.secondary">{totalCount} records available</Typography>
                    </Box>
                    <Chip label={`${selectedStudents.length} selected`} color={selectedStudents.length ? 'success' : 'default'} />
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
                                checked={students.length > 0 && students.every((student) => selectedStudents.includes(student._id))}
                                indeterminate={students.some((student) => selectedStudents.includes(student._id)) && !students.every((student) => selectedStudents.includes(student._id))}
                                onChange={(e) => setSelectedStudents(e.target.checked ? students.map((student) => student._id) : [])}
                              />
                            </HeadCell>
                            <HeadCell>Name</HeadCell>
                            <HeadCell>Username</HeadCell>
                            <HeadCell>School</HeadCell>
                            <HeadCell>Class</HeadCell>
                            <HeadCell>Section</HeadCell>
                            <HeadCell>Batches</HeadCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student._id} hover>
                              <TableCell padding="checkbox">
                                <Checkbox checked={selectedStudents.includes(student._id)} onChange={() => toggleStudent(student._id)} />
                              </TableCell>
                              <TableCell>{student.name}</TableCell>
                              <TableCell>{student.username}</TableCell>
                              <TableCell>{student.school?.name || 'N/A'}</TableCell>
                              <TableCell>{student.class || 'N/A'}</TableCell>
                              <TableCell>{student.section || 'N/A'}</TableCell>
                              <TableCell>{student.batches?.length || 0}</TableCell>
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
                    <IconButton onClick={() => setStudentPage((prev) => prev + 1)} disabled={(studentPage + 1) * itemsPerPage >= totalCount}>
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '8px' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={800}>Teachers</Typography>
                      <Typography color="text.secondary">Select one primary teacher when needed.</Typography>
                    </Box>
                    <Chip label={`${selectedTeachers.length} selected`} color={selectedTeachers.length ? 'success' : 'default'} />
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
                                checked={teachers.length > 0 && teachers.every((teacher) => selectedTeachers.includes(teacher._id))}
                                indeterminate={teachers.some((teacher) => selectedTeachers.includes(teacher._id)) && !teachers.every((teacher) => selectedTeachers.includes(teacher._id))}
                                onChange={(e) => setSelectedTeachers(e.target.checked ? teachers.map((teacher) => teacher._id) : [])}
                              />
                            </HeadCell>
                            <HeadCell>Primary</HeadCell>
                            <HeadCell>Name</HeadCell>
                            <HeadCell>Username</HeadCell>
                            <HeadCell>School</HeadCell>
                            <HeadCell>Batches</HeadCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teachers.map((teacher) => (
                            <TableRow key={teacher._id} hover>
                              <TableCell padding="checkbox">
                                <Checkbox checked={selectedTeachers.includes(teacher._id)} onChange={() => toggleTeacher(teacher._id)} />
                              </TableCell>
                              <TableCell>
                                <Radio
                                  checked={primaryTeacherId === teacher._id}
                                  disabled={!selectedTeachers.includes(teacher._id)}
                                  onChange={() => setPrimaryTeacherId(teacher._id)}
                                />
                              </TableCell>
                              <TableCell>{teacher.name}</TableCell>
                              <TableCell>{teacher.username}</TableCell>
                              <TableCell>{teacher.school?.name || 'N/A'}</TableCell>
                              <TableCell>{teacher.batches?.length || 0}</TableCell>
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
                    <IconButton onClick={() => setTeacherPage((prev) => prev + 1)} disabled={(teacherPage + 1) * itemsPerPage >= totalTeacherCount}>
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
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

export default CandidatesToBatch;
