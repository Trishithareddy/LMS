import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { BreadcrumbContext } from "../../BreadcrumbContext";

const ViewSchools = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [schools, setSchools] = useState([]);
    const [page, setPage] = useState(0);
    const [searchField, setSearchField] = useState("name");
    const [searchInput, setSearchInput] = useState("");
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 12;

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/admin/getAllSchools`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSchools(response.data || []);
        } catch (error) {
            console.error("Error fetching schools:", error);
            setSchools([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "View Schools", path: "/admin-dashboard/view-schools" },
        ]);
    }, []);

    useEffect(() => {
        fetchSchools();
    }, []);

    const filteredSchools = useMemo(() => {
        const query = searchInput.trim().toLowerCase();
        if (!query) return schools;
        return schools.filter((school) => {
            const value =
                searchField === "studentsCount"
                    ? school.students?.length || 0
                    : searchField === "teachersCount"
                    ? school.teachers?.length || 0
                    : school[searchField] || "";
            return String(value).toLowerCase().includes(query);
        });
    }, [schools, searchField, searchInput]);

    const totalPages = Math.max(1, Math.ceil(filteredSchools.length / itemsPerPage));
    const paginatedSchools = filteredSchools.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    useEffect(() => {
        setPage(0);
    }, [searchField, searchInput]);

    return (
        <Container maxWidth="xl" sx={{ my: 3 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, border: "1px solid #dfe7e2" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" }, mb: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 900 }}>
                            School Catalog
                        </Typography>
                        <Typography color="text.secondary">
                            Scan school coverage, location, and onboarded users without opening a long table.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={`${schools.length} schools`} color="success" variant="outlined" />
                        <Chip label={`${filteredSchools.length} shown`} variant="outlined" />
                    </Stack>
                </Box>

                <Grid container spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} md={3}>
                        <Select value={searchField} onChange={(e) => setSearchField(e.target.value)} fullWidth size="small">
                            <MenuItem value="name">Name</MenuItem>
                            <MenuItem value="address">Address</MenuItem>
                            <MenuItem value="city">City</MenuItem>
                            <MenuItem value="state">State</MenuItem>
                            <MenuItem value="phoneNumber">Phone Number</MenuItem>
                            <MenuItem value="zipCode">Zip Code</MenuItem>
                            <MenuItem value="studentsCount">Students Count</MenuItem>
                            <MenuItem value="teachersCount">Teachers Count</MenuItem>
                        </Select>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <TextField
                            label={`Search by ${searchField}`}
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                </Grid>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={1.5}>
                        {paginatedSchools.map((school) => (
                            <Grid item xs={12} md={6} lg={4} key={school._id}>
                                <Card variant="outlined" sx={{ height: "100%", borderColor: "#dfe7e2" }}>
                                    <CardContent>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                                                {school.name}
                                            </Typography>
                                            <Chip size="small" color="success" label={school.zipCode || "No ZIP"} />
                                        </Box>
                                        <Stack spacing={0.75} sx={{ mb: 2 }}>
                                            <Typography color="text.secondary" sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                                                <LocationOnIcon fontSize="small" />
                                                {[school.city, school.state].filter(Boolean).join(", ") || "Location not set"}
                                            </Typography>
                                            <Typography color="text.secondary" sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                                                <PhoneIcon fontSize="small" />
                                                {school.phoneNumber || "No phone"}
                                            </Typography>
                                            <Typography color="text.secondary">
                                                {school.address || "No address recorded"}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            <Chip size="small" label={`${school.students?.length || 0} students`} />
                                            <Chip size="small" label={`${school.teachers?.length || 0} teachers`} />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {!loading && !paginatedSchools.length && (
                    <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                        No schools match this search.
                    </Typography>
                )}

                <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
                    <IconButton onClick={() => setPage((prev) => Math.max(0, prev - 1))} disabled={page === 0}>
                        <ArrowBackIosNewIcon />
                    </IconButton>
                    <Typography variant="body2" sx={{ mx: 2 }}>
                        Page {page + 1} of {totalPages}
                    </Typography>
                    <IconButton onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))} disabled={page >= totalPages - 1}>
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Box>
            </Paper>
        </Container>
    );
};

export default ViewSchools;
