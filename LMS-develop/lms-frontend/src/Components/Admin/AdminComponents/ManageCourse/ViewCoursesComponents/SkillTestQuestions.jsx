import {
  Box,
  Button,
  Checkbox,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from "@mui/material";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@mui/material";


const API = import.meta.env.VITE_API_URL;

const SkillTestQuestions = ({ skillTestId, chapterId }) => {

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [questions, setQuestions] = useState([]);
  const [addedQuestions, setAddedQuestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;


  /* ---------------- FILTER STATE ---------------- */
  const [filters, setFilters] = useState({
    board: "",
    grade: "",
    chapter: "",
    type: "",
    concept: "",
    search: "",
  });

  /* ---------------- FETCH QUESTION BASE ---------------- */
  useEffect(() => {
    axios
      .get(`${API}/questionBase/get/allQuestions?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setQuestions(res.data.questions || []);
      })
      .catch((err) => {
        console.error("Failed to load questions", err);
      });
  }, []);

  /* ---------------- FETCH ADDED QUESTIONS ---------------- */
  const fetchAddedQuestions = async () => {
    if (!chapterId) return;

    try {
      const res = await axios.get(
        `${API}/skilltest/admin/chapter/${chapterId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAddedQuestions(res.data?.questions || []);
    } catch (err) {
      console.error("Failed to fetch added questions", err);
    }
  };



  useEffect(() => {
    if (chapterId) {
      fetchAddedQuestions();
    }
  }, [chapterId]);


  /* ---------------- HELPERS ---------------- */
  const addedQuestionIds = useMemo(
    () => addedQuestions.map((q) => q._id),
    [addedQuestions]
  );

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredQuestions = questions.filter((q) => {
    return (
      (!filters.board || q.boardName === filters.board) &&
      (!filters.grade || q.gradeName === filters.grade) &&
      (!filters.chapter || q.chapterName === filters.chapter) &&
      (!filters.type || q.questionType === filters.type) &&
      (!filters.concept ||
        q.concepts?.some((c) =>
          c.name.toLowerCase().includes(filters.concept.toLowerCase())
        )) &&
      (!filters.search ||
        q.questionTitle
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        q.questionId?.toString().includes(filters.search))
    );
  });

  /* ---------------- ASSIGN QUESTIONS ---------------- */
  const handleAssignQuestions = async () => {
    if (!skillTestId) {
      alert("Please create/save Skill Test first");
      return;
    }

    if (!selected.length) {
      alert("Select at least one question");
      return;
    }

    try {
      await axios.post(
        `${API}/skilltest/add-questions`,
        {
          skillTestId,
          questionIds: selected,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchAddedQuestions();
      setSelected([]);
      alert("Questions added successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to assign questions");
    }
  };

  const handleRemoveQuestion = async (questionId) => {
    if (!window.confirm("Remove this question from Skill Test?")) return;

    try {
      await axios.delete(
        `${API}/skilltest/${skillTestId}/question/${questionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchAddedQuestions(); // refresh UI
    } catch (err) {
      console.error(err);
      alert("Failed to remove question");
    }
  };


  /* ---------------- UI ---------------- */
  return (
    <Box sx={{ mt: 4 }}>
      <Divider sx={{ mb: 2 }} />
      {/* ---------------- ADDED QUESTIONS ---------------- */}
      {addedQuestions.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Added Questions
          </Typography>

          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#1b5e20" }}>
                <TableRow>
                  {["ID", "Type", "Title", "Chapter", "Action"].map((h) => (
                    <TableCell key={h} sx={{ color: "#fff" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {addedQuestions.map((q) => (
                  <TableRow key={q._id}>
                    <TableCell>{q.questionId}</TableCell>
                    <TableCell>{q.questionType}</TableCell>
                    <TableCell>{q.questionTitle}</TableCell>
                    <TableCell>{q.chapterName}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleRemoveQuestion(q._id)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}


      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Select Questions (Question Base)</Typography>
        <Button
          variant="contained"
          color="success"
          onClick={() => navigate("/admin-dashboard/question-base-tabs")}
        >
          + Create New Question
        </Button>
      </Box>

      {/* ---------------- FILTERS ---------------- */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        {[
          { label: "Board", key: "board", values: "boardName" },
          { label: "Grade", key: "grade", values: "gradeName" },
          { label: "Chapter", key: "chapter", values: "chapterName" },
          { label: "Type", key: "type", values: "questionType" },
        ].map((f) => (
          <FormControl key={f.key} size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{f.label}</InputLabel>
            <Select
              value={filters[f.key]}
              label={f.label}
              onChange={(e) => handleFilterChange(f.key, e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {[...new Set(questions.map((q) => q[f.values]).filter(Boolean))].map(
                (v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        ))}

        <TextField
          size="small"
          label="Concept"
          value={filters.concept}
          onChange={(e) => handleFilterChange("concept", e.target.value)}
        />

        <TextField
          size="small"
          label="Search"
          placeholder="Question ID / Title"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
      </Box>


      {/* ---------------- QUESTION TABLE ---------------- */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#2e7d32" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff" }} />
              {[
                "ID",
                "Type",
                "Title",
                "Board",
                "Grade",
                "Chapter",
                "Concepts",
              ].map((h) => (
                <TableCell key={h} sx={{ color: "#fff" }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No questions found
                </TableCell>
              </TableRow>
            ) : (
              filteredQuestions
                .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                .map((q) => (

                  <TableRow key={q._id} hover>
                    <TableCell>
                      <Checkbox
                        disabled={addedQuestionIds.includes(q._id)}
                        checked={selected.includes(q._id)}
                        onChange={() => toggleSelect(q._id)}
                      />
                    </TableCell>
                    <TableCell>{q.questionId}</TableCell>
                    <TableCell>{q.questionType}</TableCell>
                    <TableCell>{q.questionTitle}</TableCell>
                    <TableCell>{q.boardName || "-"}</TableCell>
                    <TableCell>{q.gradeName || "-"}</TableCell>
                    <TableCell>{q.chapterName || "-"}</TableCell>
                    <TableCell>
                      {q.concepts?.map((c) => c.name).join(", ") || "-"}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <Pagination
          sx={{ mt: 2, display: "flex", justifyContent: "center" }}
          count={Math.ceil(filteredQuestions.length / rowsPerPage)}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="success"
        />

      </TableContainer>

      <Button
        sx={{ mt: 3 }}
        variant="contained"
        color="success"
        onClick={handleAssignQuestions}
      >
        Add Selected Questions
      </Button>
    </Box>
  );
};

export default SkillTestQuestions;
