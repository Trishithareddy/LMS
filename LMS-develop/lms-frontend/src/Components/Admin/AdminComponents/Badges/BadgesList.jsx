import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  Typography,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Pagination, Stack } from "@mui/material";


const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function BadgeList() {
  const [badges, setBadges] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // badges per page
  const [total, setTotal] = useState(0);


  const loadBadges = async () => {
    try {
      const res = await axios.get(
        `${API}/api/badges?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBadges(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Load badges error:", err);
      alert("Unable to load badges");
    }
  };
  useEffect(() => {
    loadBadges();
  }, [page]);


  const deleteBadge = async (id) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;
    try {
      await axios.delete(`${API}/api/badges/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Badge deleted");
      loadBadges();
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  /* ✅ SINGLE, CLEAN FUNCTION */
  const renderAssignedFor = (audience) => {
    if (!audience) return "—";

    const value = audience.toUpperCase();

    return (
      <Chip
        label={value === "STUDENT" ? "Student" : "Teacher"}
        color={value === "STUDENT" ? "primary" : "secondary"}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate("/admin-dashboard/badges/create")}
        >
          Create Badge
        </Button>
      </Box>

      <Typography sx={{ mb: 2 }}>
        Total Badges: {total}
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell><b>Icon</b></TableCell>
              <TableCell><b>Title</b></TableCell>
              <TableCell><b>Code</b></TableCell>
              <TableCell><b>Description</b></TableCell>
              <TableCell><b>Assigned For</b></TableCell>
              <TableCell align="right"><b>Actions</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {badges.map((b) => (
              <TableRow key={b._id}>
                <TableCell>
                  {b.iconUrl ? (
                    <img
                      // src={`${API}${b.iconUrl}`}
                      src={b.iconUrl?.startsWith("http") ? b.iconUrl : `${API}${b.iconUrl}`}
                      alt="icon"
                      width={40}
                      height={40}
                      style={{ borderRadius: "6px" }}
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>

                <TableCell>{b.title}</TableCell>
                <TableCell>{b.code}</TableCell>
                <TableCell>{b.description}</TableCell>

                <TableCell>
                  {renderAssignedFor(b.audience)}
                </TableCell>

                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() =>
                      navigate(`/admin-dashboard/badges/${b._id}/edit`)
                    }
                  >
                    <EditIcon />
                  </IconButton>

                  <IconButton
                    color="error"
                    onClick={() => deleteBadge(b._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {badges.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No badges found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {(
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={Math.ceil(total / limit)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Stack>
      )}

    </Box>
  );
}
