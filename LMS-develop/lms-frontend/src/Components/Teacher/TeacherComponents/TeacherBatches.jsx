import {
    Box,
    Button,
    Grid,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    Stack,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../BreadcrumbContext";

const placeholderImage =
    "https://st4.depositphotos.com/14953852/24787/v/450/depositphotos_247872612-stock-illustration-no-image-available-icon-vector.jpg";

function TeacherBatches() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/teacher/getLoggedinTeacher`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );

                const batches = response.data?.teacher?.batches || [];
                batches.sort((a, b) => a.batchId - b.batchId);
                setData(batches);
            } catch (error) {
                console.error("Error fetching batches:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBatches();
    }, []);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Batches", path: "/teacher-dashboard/batches" },
        ]);
    }, [setBreadcrumbTrail]);

    const filteredBatches = useMemo(() => {
        return data.filter((batch) =>
            batch.batchName.toLowerCase().includes(search.toLowerCase()),
        );
    }, [data, search]);

    const handleBatchDetails = (id) => {
        navigate("/teacher-dashboard/batchdetails", {
            state: {
                _id: id,
                from: "batches",
            },
        });
    };

    if (loading) {
        return (
            <Box
                sx={{
                    width: "100%",
                    height: "60vh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: { xs: 2, md: 3 },
                bgcolor: "background.default",
                color: "text.primary",
                minHeight: "100vh",
            }}
        >
            <Box
                sx={{
                    maxWidth: 900,
                    mx: "auto",
                    mb: 3,
                    textAlign: "center",
                }}
            >
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "text.primary" }}
                >
                    Batches
                </Typography>
                <Typography sx={{ mt: 1, color: "text.secondary" }}>
                    Open the class groups you teach and jump straight into their course content.
                </Typography>
                <TextField
                    placeholder="Search batch by name..."
                    fullWidth
                    sx={{
                        mt: 3,
                        bgcolor: "background.paper",
                        borderRadius: 3,

                        "& .MuiOutlinedInput-root": {
                            bgcolor: "background.paper",
                        },
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: "text.secondary" }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Grid container spacing={3} sx={{ justifyContent: "center" }}>
                {filteredBatches.map((batch) => (
                    <Grid
                        item
                        xs={12}
                        md={filteredBatches.length === 1 ? 9 : 6}
                        xl={filteredBatches.length >= 5 ? 4 : 6}
                        key={batch._id}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2.5,
                                borderRadius: 4,
                                border: 1,
                                borderColor: "divider",
                                bgcolor: "background.paper",
                                boxShadow: 2,
                                transition: "all 0.25s ease",
                                "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: 5,
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    minHeight: 132,
                                }}
                            >
                                <Box
                                    sx={{
                                        flexShrink: 0,
                                        width: { xs: 96, sm: 108 },
                                        height: { xs: 96, sm: 108 },
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        border: 1,
                                        borderColor: "divider",
                                        bgcolor: "background.default",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <img
                                        src={batch.batchImageUrl || placeholderImage}
                                        alt={batch.batchName}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </Box>

                                <Box
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: { xs: 18, md: 22 },
                                            fontWeight: 700,
                                            color: "text.primary",
                                            lineHeight: 1.25,
                                        }}
                                    >
                                        {batch.batchName}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            mt: 1,
                                            fontSize: 14,
                                            color: "text.secondary",
                                        }}
                                    >
                                        Open this batch to view its chapters, lessons, and learning content.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Button
                                        onClick={() =>
                                            handleBatchDetails(batch._id)
                                        }
                                        variant="contained"
                                        sx={{
                                            minWidth: 100,
                                            borderRadius: 999,
                                            px: 3,
                                            py: 1.25,
                                            fontWeight: 700,
                                            textTransform: "none",
                                            boxShadow: 0,
                                        }}
                                    >
                                        Open
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {!filteredBatches.length && (
                <Box
                    sx={{
                        mt: 4,
                        mx: "auto",
                        maxWidth: 720,
                        p: 4,
                        borderRadius: 3,
                        border: 1,
                        borderStyle: "dashed",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        textAlign: "center",
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "text.primary",
                        }}
                    >
                        No batches match this search
                    </Typography>
                    <Typography sx={{ mt: 0.5, color: "text.secondary" }}>
                        Try another batch name to find the class you want to open.
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default TeacherBatches;
