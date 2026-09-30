import {
    Box,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";
import React from "react";

const ChapterTeachingProgress = ({
    chapter,
    lessonProgressMap,
}) => {
    const lessons = chapter?.lessons || [];

    const lessonIds = lessons
        .map((lesson) =>
            typeof lesson === "object" ? lesson._id : lesson,
        )
        .filter(Boolean);

    const totalLessons = lessonIds.length;

    const completedCount = lessonIds.filter(
        (lessonId) => lessonProgressMap[lessonId] === "completed",
    ).length;

    const inProgressCount = lessonIds.filter(
        (lessonId) => lessonProgressMap[lessonId] === "in-progress",
    ).length;

    const notStartedCount = Math.max(
        totalLessons - completedCount - inProgressCount,
        0,
    );

    const progressPercentage =
        totalLessons > 0
            ? Math.round((completedCount / totalLessons) * 100)
            : 0;

    if (!chapter) {
        return null;
    }

    return (
        <Card
            sx={{
                mx: { xs: 2, md: 3 },
                mt: 2,
                mb: 2,
                borderRadius: 2,
                boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
                border: "1px solid rgba(0,0,0,0.08)",
            }}
        >
            <CardContent>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                        mb: 2,
                    }}
                >
                    <Box>
                        <Typography
                            variant="overline"
                            sx={{
                                color: "text.secondary",
                                lineHeight: 1,
                            }}
                        >
                            Teaching Progress
                        </Typography>

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 700,
                                mt: 0.5,
                            }}
                        >
                            {chapter.name || "Selected Chapter"}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Batch-wise lesson completion tracking
                        </Typography>
                    </Box>

                    <Chip
                        label={`${progressPercentage}% Completed`}
                        color={
                            progressPercentage === 100
                                ? "success"
                                : progressPercentage > 0
                                  ? "primary"
                                  : "default"
                        }
                        sx={{ fontWeight: 600 }}
                    />
                </Box>

                <Box sx={{ mb: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={progressPercentage}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: "rgba(0,0,0,0.08)",
                        }}
                    />
                </Box>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                >
                    <ProgressStat
                        label="Completed"
                        value={completedCount}
                        color="#2e7d32"
                        background="#e8f5e9"
                    />

                    <ProgressStat
                        label="In Progress"
                        value={inProgressCount}
                        color="#ed6c02"
                        background="#fff3e0"
                    />

                    <ProgressStat
                        label="Not Started"
                        value={notStartedCount}
                        color="#455a64"
                        background="#eceff1"
                    />

                    <ProgressStat
                        label="Total Lessons"
                        value={totalLessons}
                        color="#1565c0"
                        background="#e3f2fd"
                    />
                </Stack>
            </CardContent>
        </Card>
    );
};

const ProgressStat = ({ label, value, color, background }) => {
    return (
        <Box
            sx={{
                flex: 1,
                minWidth: 130,
                px: 2,
                py: 1.5,
                borderRadius: 1.5,
                backgroundColor: background,
                border: "1px solid rgba(0,0,0,0.06)",
            }}
        >
            <Typography
                variant="h6"
                sx={{
                    color,
                    fontWeight: 800,
                    lineHeight: 1.1,
                }}
            >
                {value}
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    color: "text.secondary",
                }}
            >
                {label}
            </Typography>
        </Box>
    );
};

export default ChapterTeachingProgress;