import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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

const ViewTeachers = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
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

    const [open, setOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [username, setUsername] = useState("");

    const handleEdit = (teacher) => {
        setSelectedTeacher(teacher);
        setUsername(teacher.username);
        setOpen(true);
    };

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Teacher Records", path: "/admin-dashboard/view-Teachers" },
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

    useEffect(() => {
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
            } catch (error) {
                console.error("Error fetching teacher groups:", error);
                setErrorMessage("Error fetching teacher groups");
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherGroups();
    }, [searchTags]);

    const updateTeacher = async () => {
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/teacher/update/${selectedTeacher._id}`,
                {
                    username
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setGroupTeachers((prev) => {
                const updated = { ...prev };

                Object.keys(updated).forEach((key) => {
                    updated[key] = updated[key].map((teacher) =>
                        teacher._id === selectedTeacher._id
                            ? { ...teacher, username }
                            : teacher
                    );
                });

                return updated;
            });

            setSuccessMessage("Teacher updated successfully");
            setOpen(false);
        } catch (err) {
            console.error(err);
            setErrorMessage("Failed to update teacher");
        }
    };

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

    return (
        <Container maxWidth="xl" sx={{ my: 3 }}>
            <Paper
                elevation={0}
                sx={{ p: { xs: 2, md: 3 }, bgcolor: "#ffffff", borderRadius: 2, border: "1px solid #dfe7e2" }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                            Teacher Records
                        </Typography>
                        <Typography color="text.secondary">
                            Browse teachers school-wise and narrow records by name or username.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={`${totalCount} teachers`} color="success" variant="outlined" />
                        <Chip label={`${teacherGroups.length} schools`} variant="outlined" />
                    </Stack>
                </Box>

                <Grid container spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="teacher-school-filter">School</InputLabel>
                            <Select
                                labelId="teacher-school-filter"
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
                    <Box sx={{ mb: 1 }}>
                        {teacherGroups.map((group) => {
                            const groupKey = getGroupKey(group);
                            const teachersInGroup = groupTeachers[groupKey] || [];
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
                                            <Typography sx={{ fontWeight: 850 }}>{group.schoolName}</Typography>
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
                                                            <StyledTableCell>Name</StyledTableCell>
                                                            <StyledTableCell>Username</StyledTableCell>
                                                            <StyledTableCell>Number of Batches</StyledTableCell>
                                                            <StyledTableCell>Actions</StyledTableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {teachersInGroup.map((teacher) => (
                                                            <StyledTableRow key={teacher._id}>
                                                                <CompactTableCell>{teacher.name}</CompactTableCell>
                                                                <CompactTableCell>{teacher.username}</CompactTableCell>
                                                                <CompactTableCell>{teacher.batches?.length || 0}</CompactTableCell>
                                                                <CompactTableCell>
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        onClick={() => handleEdit(teacher)}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                </CompactTableCell>
                                                            </StyledTableRow>
                                                        ))}
                                                        {!teachersInGroup.length && (
                                                            <TableRow>
                                                                <TableCell colSpan={4} align="center">
                                                                    Opened school has no matching teachers.
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
            </Paper>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Edit Teacher Username</DialogTitle>

                <DialogContent>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setOpen(false)}>
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={updateTeacher}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={!!errorMessage}
                autoHideDuration={6000}
                onClose={() => setErrorMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert onClose={() => setErrorMessage("")} severity="error" sx={{ width: "100%" }}>
                    {errorMessage}
                </Alert>
            </Snackbar>
            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    severity="success"
                    onClose={() => setSuccessMessage("")}
                    sx={{ width: "100%" }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ViewTeachers;
