import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TextField,
} from "@mui/material";

const API =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

export default function StudentsWithBadges() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // filters
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, rowsPerPage, search, course, academicYear]);

  const fetchData = async () => {
    const res = await axios.get(
      `${API}/api/badges/teacher/students-with-badges`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page + 1,        // backend is 1-based
          limit: rowsPerPage,
          search,
          course,
          academicYear,
        },
      }
    );

    setRows(res.data.rows || []);
    setTotal(res.data.total || 0);
  };

  return (
    <Box>
      {/* 🔍 Search & Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <TextField
            size="small"
            label="Search Student"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />

          <TextField
            size="small"
            label="Course"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setPage(0);
            }}
          />

          <TextField
            size="small"
            label="Academic Year"
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              setPage(0);
            }}
          />
        </Box>
      </Paper>

      {/* 📊 Table */}
      <Paper sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><b>Badge</b></TableCell>
              <TableCell><b>Course</b></TableCell>
              <TableCell><b>Chapter</b></TableCell>
              <TableCell><b>Student</b></TableCell>
              <TableCell><b>Awarded On</b></TableCell>
              <TableCell><b>Academic Year</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No students have earned badges yet
                </TableCell>
              </TableRow>
            ) : (
              rows.map((s) => (
                <TableRow key={s._id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar
                        src={`${API}${s.badge.iconUrl}`}
                        sx={{ width: 28, height: 28 }}
                      />
                      <Typography variant="body2">
                        {s.badge.title}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>{s.course}</TableCell>
                  <TableCell>{s.chapter || "—"}</TableCell>
                  <TableCell>{s.studentName}</TableCell>
                  <TableCell>
                    {new Date(s.awardedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{s.academicYear || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 📄 Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
}

