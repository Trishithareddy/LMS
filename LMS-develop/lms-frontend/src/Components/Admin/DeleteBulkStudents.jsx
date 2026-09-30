import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
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
    CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { BreadcrumbContext } from "../BreadcrumbContext";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: "bold",
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    textAlign: "center",
    padding: theme.spacing(1),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
    },
}));

const CompactTableCell = styled(TableCell)({
    padding: "8px",
    textAlign: "center",
});

const DeleteMultipleStudents = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [studentPage, setStudentPage] = useState(0);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("name");
    const [currentInput, setCurrentInput] = useState("");
    const token = localStorage.getItem("token");
    const itemsPerPage = 50;
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [schools, setSchools] = useState([]);
    const [studentGroups, setStudentGroups] = useState([]);
    const [groupStudents, setGroupStudents] = useState({});
    const [loadingGroupKey, setLoadingGroupKey] = useState("");

    const handleSelectAllChange = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);

        if (isChecked) {
            const filteredStudentIds = students.map((std) => std._id);
            setSelectedStudents(filteredStudentIds);
        } else {
            setSelectedStudents([]);
        }
    };

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            {
                name: "Delete Students",
                path: "/admin-dashboard/delete-bulk-students",
            },
        ]);
    }, []);

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/admin/getAllSchools`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSchools(response.data || []);
            } catch (error) {
                console.error("Error fetching schools:", error);
            }
        };
        fetchSchools();
    }, []);

    const buildQueryString = (params) => {
        const searchParams = new URLSearchParams();
        for (const key in params) {
            if (params[key].length > 0) {
                searchParams.set(key, params[key].join(","));
            }
        }
        return searchParams.toString();
    };

    useEffect(() => {
        fetchStudentGroups();
    }, [searchTags]);
    const fetchStudentGroups = async () => {
        setLoading(true);
        try {
            const query = buildQueryString(searchTags);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/student-groups?${query}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStudentGroups(response.data.groups || []);
            setTotalCount(response.data.totalStudents);
            setGroupStudents({});
            setSelectedStudents([]);
        } catch (error) {
            console.error("Error fetching student groups:", error);
            setErrorMessage("Error fetching student groups");
        } finally {
            setLoading(false);
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedStudents.length === 0) {
            setErrorMessage("Please select students to delete");
            return;
        }
        setLoading(true);
        try {
            await axios.post(
                `${
                    import.meta.env.VITE_API_URL
                }/admin/delete-multiple-students`,
                {
                    studentIds: selectedStudents,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setSuccessMessage("Students deleted successfully");
            setSelectedStudents([]);
            fetchStudentGroups(); // Refresh groups after deletion
        } catch (error) {
            console.error("Error deleting students:", error);
            setErrorMessage("Error deleting students");
        } finally {
            setLoading(false);
        }
    };

    const handleStudentToggle = (studentId) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleNextPage = () => {
        if ((studentPage + 1) * itemsPerPage < totalCount) {
            setStudentPage((prevPage) => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (studentPage > 0) {
            setStudentPage((prevPage) => prevPage - 1);
        }
    };

    const handleAddTag = (event) => {
        if (event.key === "Enter" && event.target.value.trim() !== "") {
            setSearchTags((prev) => ({
                ...prev,
                [currentField]: [
                    ...(prev[currentField] || []),
                    event.target.value.trim(),
                ],
            }));
            setCurrentInput("");
            setStudentPage(0);
        }
    };

    const handleDeleteTag = (field, tagToDelete) => {
        setSearchTags((prev) => ({
            ...prev,
            [field]: prev[field].filter((tag) => tag !== tagToDelete),
        }));
    };

    const setFilterValue = (field, value) => {
        setSearchTags((prev) => {
            const next = { ...prev };
            if (value) {
                next[field] = [value];
            } else {
                delete next[field];
            }
            return next;
        });
        setStudentPage(0);
        setSelectedStudents([]);
    };

    const clearFilters = () => {
        setSearchTags({});
        setCurrentInput("");
        setStudentPage(0);
        setSelectedStudents([]);
    };

    const getGroupKey = (group) =>
        `${group.schoolName}__${group.class || "No class"}__${group.section || "No section"}`;

    const fetchGroupStudents = async (group) => {
        const groupKey = getGroupKey(group);
        if (groupStudents[groupKey]) return;

        setLoadingGroupKey(groupKey);
        try {
            const query = buildQueryString({
                ...searchTags,
                school: [group.schoolName],
                class: [group.class],
                section: [group.section],
            });
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/getAllStudents?page=1&limit=500&${query}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGroupStudents((prev) => ({
                ...prev,
                [groupKey]: response.data.data || [],
            }));
        } catch (error) {
            console.error("Error fetching group students:", error);
            setErrorMessage("Error fetching group students");
        } finally {
            setLoadingGroupKey("");
        }
    };

    const handleGroupToggle = (groupStudents, checked) => {
        const groupIds = groupStudents.map((student) => student._id);
        setSelectedStudents((prev) => {
            if (checked) {
                return Array.from(new Set([...prev, ...groupIds]));
            }
            return prev.filter((id) => !groupIds.includes(id));
        });
    };

    const renderSearchFields = () => {
        const fields = ["name", "username", "school", "class", "section"];

        return (
            <Box
                sx={{
                    mb: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Grid
                    container
                    spacing={2}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ maxWidth: "600px" }}
                >
                    <Grid item xs={12} sm={4}>
                        <Select
                            value={currentField}
                            onChange={(e) => setCurrentField(e.target.value)}
                            fullWidth
                            size="small"
                        >
                            {fields.map((field) => (
                                <MenuItem key={field} value={field}>
                                    {field}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            label={`Search by ${currentField}`}
                            variant="outlined"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            onKeyPress={handleAddTag}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                </Grid>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            flexWrap: "wrap",
                            justifyContent: "center",
                            maxWidth: "600px",
                        }}
                    >
                        {Object.entries(searchTags).map(([field, tags]) =>
                            tags.map((tag) => (
                                <Chip
                                    key={`${field}-${tag}`}
                                    label={`${field}: ${tag}`}
                                    onDelete={() => handleDeleteTag(field, tag)}
                                    size="small"
                                    sx={{ mb: 1 }}
                                />
                            ))
                        )}
                    </Stack>
                </Box>
            </Box>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ my: 3 }}>
            <Paper
                elevation={0}
                sx={{ p: { xs: 2, md: 3 }, bgcolor: "#ffffff", borderRadius: 2, border: "1px solid #dfe7e2" }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                            Delete Students
                        </Typography>
                        <Typography color="text.secondary">
                            Filter by school, class, and section before selecting students to remove.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={`${totalCount} students`} color="success" variant="outlined" />
                        <Chip label={`${studentGroups.length} groups`} variant="outlined" />
                        <Chip label={`${selectedStudents.length} selected`} color={selectedStudents.length ? "error" : "default"} variant="outlined" />
                    </Stack>
                </Box>

                <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="delete-student-school-filter">School</InputLabel>
                            <Select
                                labelId="delete-student-school-filter"
                                label="School"
                                value={searchTags.school?.[0] || ""}
                                onChange={(e) => setFilterValue("school", e.target.value)}
                            >
                                <MenuItem value="">All schools</MenuItem>
                                {schools.map((school) => (
                                    <MenuItem key={school._id} value={school.name}>
                                        {school.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField label="Class" value={searchTags.class?.[0] || ""} onChange={(e) => setFilterValue("class", e.target.value)} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <TextField label="Section" value={searchTags.section?.[0] || ""} onChange={(e) => setFilterValue("section", e.target.value)} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Select value={currentField} onChange={(e) => setCurrentField(e.target.value)} size="small" sx={{ minWidth: 140 }}>
                                <MenuItem value="name">Name</MenuItem>
                                <MenuItem value="username">Username</MenuItem>
                            </Select>
                            <TextField label={`Search by ${currentField}`} value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} onKeyPress={handleAddTag} fullWidth size="small" />
                        </Box>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                    {Object.entries(searchTags).map(([field, tags]) =>
                        tags.map((tag) => (
                            <Chip key={`${field}-${tag}`} label={`${field}: ${tag}`} onDelete={() => handleDeleteTag(field, tag)} size="small" />
                        ))
                    )}
                    {Object.keys(searchTags).length > 0 && (
                        <Button size="small" color="success" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </Stack>
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "20px",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ mb: 3 }}>
                        {studentGroups.map((group) => {
                            const groupKey = getGroupKey(group);
                            const studentsInGroup = groupStudents[groupKey] || [];
                            const groupIds = studentsInGroup.map((student) => student._id);
                            const selectedInGroup = groupIds.filter((id) => selectedStudents.includes(id));
                            const allGroupSelected = groupIds.length > 0 && selectedInGroup.length === groupIds.length;
                            return (
                                <Accordion
                                    key={groupKey}
                                    disableGutters
                                    onChange={(_, expanded) => {
                                        if (expanded) fetchGroupStudents(group);
                                    }}
                                    sx={{ mb: 1, border: "1px solid #dfe7e2", borderRadius: 1, overflow: "hidden" }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1, flexWrap: "wrap" }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Checkbox
                                                    checked={allGroupSelected}
                                                    indeterminate={selectedInGroup.length > 0 && !allGroupSelected}
                                                    onClick={(event) => event.stopPropagation()}
                                                    disabled={!groupStudents[groupKey]}
                                                    onChange={(event) => handleGroupToggle(studentsInGroup, event.target.checked)}
                                                />
                                                <Typography sx={{ fontWeight: 850 }}>
                                                    {group.schoolName}
                                                </Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <Chip size="small" label={`Class ${group.class || "NA"}`} />
                                                <Chip size="small" label={`Section ${group.section}`} />
                                                <Chip size="small" color="success" label={`${group.count} students`} />
                                            </Stack>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {loadingGroupKey === groupKey ? (
                                            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : (
                                        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #edf1ee" }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <StyledTableCell>Select</StyledTableCell>
                                                        <StyledTableCell>Name</StyledTableCell>
                                                        <StyledTableCell>Username</StyledTableCell>
                                                        <StyledTableCell>Batches</StyledTableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {studentsInGroup.map((student) => (
                                                        <StyledTableRow key={student._id}>
                                                            <CompactTableCell>
                                                                <Checkbox
                                                                    checked={selectedStudents.includes(student._id)}
                                                                    onChange={() => handleStudentToggle(student._id)}
                                                                />
                                                            </CompactTableCell>
                                                            <CompactTableCell>{student.name}</CompactTableCell>
                                                            <CompactTableCell>{student.username}</CompactTableCell>
                                                            <CompactTableCell>{student.batches ? student.batches.length : 0}</CompactTableCell>
                                                        </StyledTableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                    </Box>
                )}

                <Box display="flex" justifyContent="center" mt={3}>
                    <Button
                        variant="contained"
                        onClick={handleDeleteSelected}
                        disabled={selectedStudents.length === 0}
                        sx={{
                            bgcolor: "error.main",
                            "&:hover": { bgcolor: "error.dark" },
                            borderRadius: "20px",
                            padding: "8px 24px",
                        }}
                    >
                        Delete Selected Students
                    </Button>
                </Box>
            </Paper>
            <Snackbar
                open={!!successMessage}
                autoHideDuration={6000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setSuccessMessage("")}
                    severity="success"
                    sx={{ width: "100%" }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!errorMessage}
                autoHideDuration={6000}
                onClose={() => setErrorMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setErrorMessage("")}
                    severity="error"
                    sx={{ width: "100%" }}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DeleteMultipleStudents;
