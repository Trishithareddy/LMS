import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    Grid,
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
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

const DeleteMultipleTeachers = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [searchTags, setSearchTags] = useState({});
    const [currentField, setCurrentField] = useState("name");
    const [currentInput, setCurrentInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [schools, setSchools] = useState([]);
    const [teacherGroups, setTeacherGroups] = useState([]);
    const [groupTeachers, setGroupTeachers] = useState({});
    const [loadingGroupKey, setLoadingGroupKey] = useState("");
    const [totalCount, setTotalCount] = useState(0);
    const token = localStorage.getItem("token");

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Delete Teachers", path: "/admin-dashboard/delete-bulk-teachers" },
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
            if (params[key]?.length > 0) {
                searchParams.set(key, params[key].join(","));
            }
        }
        return searchParams.toString();
    };

    const fetchTeacherGroups = async () => {
        setLoading(true);
        try {
            const query = buildQueryString(searchTags);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/teacher-groups?${query}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTeacherGroups(response.data.groups || []);
            setTotalCount(response.data.totalTeachers || 0);
            setGroupTeachers({});
            setSelectedTeachers([]);
        } catch (error) {
            console.error("Error fetching teacher groups:", error);
            setErrorMessage("Error fetching teacher groups");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeacherGroups();
    }, [searchTags]);

    const setFilterValue = (field, value) => {
        setSearchTags((prev) => {
            const next = { ...prev };
            if (value) next[field] = [value];
            else delete next[field];
            return next;
        });
    };

    const handleAddTag = (event) => {
        if (event.key === "Enter" && currentInput.trim() !== "") {
            setSearchTags((prev) => ({
                ...prev,
                [currentField]: [...(prev[currentField] || []), currentInput.trim()],
            }));
            setCurrentInput("");
        }
    };

    const handleDeleteTag = (field, tagToDelete) => {
        setSearchTags((prev) => {
            const nextTags = (prev[field] || []).filter((tag) => tag !== tagToDelete);
            const next = { ...prev };
            if (nextTags.length) next[field] = nextTags;
            else delete next[field];
            return next;
        });
    };

    const clearFilters = () => {
        setSearchTags({});
        setCurrentInput("");
    };

    const getGroupKey = (group) => `${group.schoolName || "No school assigned"}__teachers`;

    const fetchGroupTeachers = async (group) => {
        const groupKey = getGroupKey(group);
        if (groupTeachers[groupKey]) return;

        setLoadingGroupKey(groupKey);
        try {
            const query = buildQueryString({
                ...searchTags,
                school: [group.schoolName],
            });
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/getAllTeachers?page=1&limit=500&${query}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGroupTeachers((prev) => ({
                ...prev,
                [groupKey]: response.data.data || [],
            }));
        } catch (error) {
            console.error("Error fetching group teachers:", error);
            setErrorMessage("Error fetching group teachers");
        } finally {
            setLoadingGroupKey("");
        }
    };

    const handleTeacherToggle = (teacherId) => {
        setSelectedTeachers((prev) =>
            prev.includes(teacherId)
                ? prev.filter((id) => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const handleGroupSelect = (groupKey, checked) => {
        const ids = (groupTeachers[groupKey] || []).map((teacher) => teacher._id);
        setSelectedTeachers((prev) =>
            checked
                ? Array.from(new Set([...prev, ...ids]))
                : prev.filter((id) => !ids.includes(id))
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedTeachers.length === 0) {
            setErrorMessage("Please select teachers to delete");
            return;
        }
        setLoading(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/admin/delete-multiple-teachers`,
                { teacherIds: selectedTeachers },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage("Teachers deleted successfully");
            await fetchTeacherGroups();
        } catch (error) {
            console.error("Error deleting teachers:", error);
            setErrorMessage("Error deleting teachers");
        } finally {
            setLoading(false);
        }
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
                            Delete Teachers
                        </Typography>
                        <Typography color="text.secondary">
                            Filter by school before selecting teacher accounts to remove.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={`${totalCount} teachers`} color="success" variant="outlined" />
                        <Chip label={`${selectedTeachers.length} selected`} variant="outlined" />
                    </Stack>
                </Box>

                <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="delete-teacher-school-filter">School</InputLabel>
                            <Select
                                labelId="delete-teacher-school-filter"
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
                    <Grid item xs={12} md={5}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Select
                                value={currentField}
                                onChange={(e) => setCurrentField(e.target.value)}
                                size="small"
                                sx={{ minWidth: 140 }}
                            >
                                <MenuItem value="name">Name</MenuItem>
                                <MenuItem value="username">Username</MenuItem>
                            </Select>
                            <TextField
                                label={`Search by ${currentField}`}
                                value={currentInput}
                                onChange={(e) => setCurrentInput(e.target.value)}
                                onKeyPress={handleAddTag}
                                fullWidth
                                size="small"
                            />
                        </Box>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                    {Object.entries(searchTags).map(([field, tags]) =>
                        tags.map((tag) => (
                            <Chip
                                key={`${field}-${tag}`}
                                label={`${field}: ${tag}`}
                                onDelete={() => handleDeleteTag(field, tag)}
                                size="small"
                            />
                        ))
                    )}
                    {Object.keys(searchTags).length > 0 && (
                        <Button size="small" color="success" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    )}
                </Stack>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        {teacherGroups.map((group) => {
                            const groupKey = getGroupKey(group);
                            const teachersInGroup = groupTeachers[groupKey] || [];
                            const groupIds = teachersInGroup.map((teacher) => teacher._id);
                            const allSelected = groupIds.length > 0 && groupIds.every((id) => selectedTeachers.includes(id));
                            const someSelected = groupIds.some((id) => selectedTeachers.includes(id));

                            return (
                                <Accordion
                                    key={groupKey}
                                    disableGutters
                                    onChange={(_, expanded) => {
                                        if (expanded) fetchGroupTeachers(group);
                                    }}
                                    sx={{ mb: 1, border: "1px solid #dfe7e2", borderRadius: 1, overflow: "hidden" }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1, flexWrap: "wrap" }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Checkbox
                                                    checked={allSelected}
                                                    indeterminate={someSelected && !allSelected}
                                                    disabled={!teachersInGroup.length}
                                                    onClick={(event) => event.stopPropagation()}
                                                    onChange={(event) => handleGroupSelect(groupKey, event.target.checked)}
                                                />
                                                <Typography sx={{ fontWeight: 850 }}>{group.schoolName}</Typography>
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                <Chip size="small" color="success" label={`${group.count} teachers`} />
                                                <Chip size="small" label={`${group.totalBatches || 0} batch links`} />
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
                                                            <StyledTableCell>Number of Batches</StyledTableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {teachersInGroup.map((teacher) => (
                                                            <StyledTableRow key={teacher._id}>
                                                                <CompactTableCell>
                                                                    <Checkbox
                                                                        checked={selectedTeachers.includes(teacher._id)}
                                                                        onChange={() => handleTeacherToggle(teacher._id)}
                                                                    />
                                                                </CompactTableCell>
                                                                <CompactTableCell>{teacher.name}</CompactTableCell>
                                                                <CompactTableCell>{teacher.username}</CompactTableCell>
                                                                <CompactTableCell>{teacher.batches?.length || 0}</CompactTableCell>
                                                            </StyledTableRow>
                                                        ))}
                                                        {!teachersInGroup.length && (
                                                            <TableRow>
                                                                <TableCell colSpan={4} align="center">
                                                                    Open this school to load matching teachers.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                        {!teacherGroups.length && (
                            <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                                No teacher records match the selected filters.
                            </Typography>
                        )}
                    </Box>
                )}

                <Box display="flex" justifyContent="center" mt={3}>
                    <Button
                        variant="contained"
                        onClick={handleDeleteSelected}
                        disabled={!selectedTeachers.length || loading}
                        sx={{
                            bgcolor: "error.main",
                            "&:hover": { bgcolor: "error.dark" },
                            borderRadius: "20px",
                            padding: "8px 24px",
                        }}
                    >
                        Delete Selected Teachers
                    </Button>
                </Box>
            </Paper>
            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={() => setSuccessMessage("")} severity="success" sx={{ width: "100%" }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={() => setErrorMessage("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                <Alert onClose={() => setErrorMessage("")} severity="error" sx={{ width: "100%" }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DeleteMultipleTeachers;
