//AwardToCourseTeachers.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, Alert } from '@mui/material';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AwardToCourseTeachers() {
  const [badges, setBadges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [badgeId, setBadgeId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // load badges
    axios.get(`${API}/api/badges`, { headers })
      .then(res => setBadges((res.data && res.data.data) || res.data || []))
      .catch(err => {
        console.error('load badges error', err);
        setMessage({ type: 'error', text: 'Failed to load badges (see console)' });
      });

    // load courses (adjust endpoint if your api path differs)
    axios.get(`${API}/courses/getAllCourses`, { headers })
      .then(res => {
        // adapt to your response shape
        const items = res.data?.data || res.data || [];
        setCourses(items);
      })
      .catch(err => {
        console.error('load courses error', err);
        setMessage({ type: 'error', text: 'Failed to load courses (see console)' });
      });
  }, []);

  const doAward = async () => {
    setMessage(null);
    if (!badgeId) return setMessage({ type: 'error', text: 'Select a badge' });
    if (!courseId) return setMessage({ type: 'error', text: 'Select a course' });

    if (!window.confirm('Are you sure you want to award the selected badge to teachers of this course?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = { courseId, badgeId, awardedBy: null }; // pass awardedBy if you have admin user id
      const res = await axios.post(`${API}/api/badges/user-badges/award-to-course-teachers`, payload, { headers });
      console.log('award response', res.data);
      setMessage({ type: 'success', text: `Awarded ${res.data?.awarded ?? 0} teacher(s)` });
    } catch (err) {
      console.error('award-to-course-teachers error', err);
      const serverMsg = err?.response?.data?.message || err?.response?.data || err.message;
      setMessage({ type: 'error', text: `Error: ${typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg)}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Award badge to teachers of a course</Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Badge</InputLabel>
        <Select value={badgeId} label="Badge" onChange={(e) => setBadgeId(e.target.value)}>
          <MenuItem value=""><em>— select —</em></MenuItem>
          {badges.map(b => <MenuItem key={b._id || b.id} value={b._id || b.id}>{b.title || b.name}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Course</InputLabel>
        <Select value={courseId} label="Course" onChange={(e) => setCourseId(e.target.value)}>
          <MenuItem value=""><em>— select course —</em></MenuItem>
          {courses.map(c => <MenuItem key={c._id || c.courseId || c.id} value={c._id || c.courseId || c.id}>{c.title || c.name || c.courseName}</MenuItem>)}
        </Select>
      </FormControl>

      <Button variant="contained" onClick={doAward} disabled={loading} sx={{ mr: 2 }}>
        {loading ? 'AWARDING…' : 'AWARD TO COURSE TEACHERS'}
      </Button>

      <Button variant="outlined" onClick={() => {
        console.log('DEBUG selection', { badgeId, courseId });
        setMessage({ type: 'info', text: `DEBUG: badgeId=${badgeId}, courseId=${courseId}` });
      }}>
        DEBUG (LOG SELECTION)
      </Button>
    </Box>
  );
}
