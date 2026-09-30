import React, { useState } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    Avatar,
    Stack,
} from "@mui/material";
import { Groups, Person, CalendarToday, Schedule } from "@mui/icons-material";
const BatchList = ({ batches, onBatchSelect }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "#2E7D32";
            case "upcoming":
                return "#1976D2";
            case "completed":
                return "#757575";
            default:
                return "#757575";
        }
    };

    const truncateDescription = (text, wordLimit = 10) => {
        if (!text || typeof text !== "string") return ""; // safety check
        const words = text.trim().split(" ");
        if (words.length <= wordLimit) return text;
        return words.slice(0, wordLimit).join(" ") + "...";
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: "bold", mb: 3 }}
            >
                Assigned Batches
            </Typography>

            <Grid container spacing={3}>
                {batches.map((batch) => (
                    <Grid item xs={12} md={6} lg={4} key={batch._id}>
                        <Card
                            elevation={2}
                            sx={{
                                height: "100%",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                                "&:hover": {
                                    elevation: 6,
                                    transform: "translateY(-4px)",
                                },
                            }}
                            onClick={() => onBatchSelect(batch)}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 2,
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            backgroundColor: "#2E7D32",
                                            mr: 2,
                                        }}
                                    >
                                        <Groups />
                                    </Avatar>
                                    <Chip
                                        label="active"
                                        size="small"
                                        sx={{
                                            backgroundColor: "#2E7D32",
                                            color: "white",
                                            fontWeight: "bold",
                                        }}
                                    />
                                </Box>

                                <Typography
                                    variant="h6"
                                    component="h2"
                                    gutterBottom
                                    sx={{ fontWeight: "bold" }}
                                >
                                    {batch.batchName}
                                </Typography>

                                {batch.courses.map((crs) => (
                                    <>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2 }}
                                        >
                                            {crs.name}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 3, lineHeight: 1.6 }}
                                        >
                                            {truncateDescription(crs.description)}
                                        </Typography>
                                    </>
                                ))}

                                <Stack spacing={2}>
                                    {/* <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <CalendarToday
                                            sx={{
                                                fontSize: 18,
                                                color: "#757575",
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Start:{" "}
                                            {new Date(
                                                batch.createdAt
                                            ).toLocaleDateString()}
                                        </Typography>
                                    </Box> */}

                                    {/* <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <Schedule
                                            sx={{
                                                fontSize: 18,
                                                color: "#757575",
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Duration: 8 months
                                        </Typography>
                                    </Box> */}

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            pt: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <Groups
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#2E7D32",
                                                }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#2E7D32",
                                                    fontWeight: "medium",
                                                }}
                                            >
                                                {batch.students.length} Students
                                            </Typography>
                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                            }}
                                        >
                                            <Person
                                                sx={{
                                                    fontSize: 18,
                                                    color: "#1976D2",
                                                }}
                                            />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "#1976D2",
                                                    fontWeight: "medium",
                                                }}
                                            >
                                                {batch.teachers.length} Teachers
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    sx={{
                                        mt: 2,
                                        borderColor: "#2E7D32",
                                        color: "#2E7D32",
                                        "&:hover": {
                                            borderColor: "#2E7D32",
                                            backgroundColor: "#E8F5E8",
                                        },
                                    }}
                                >
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default BatchList;
