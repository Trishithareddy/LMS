import React, { useContext, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import QuizTabs from "../../Admin/QuizTabs";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import SubmittedQuizCard from "./SubmittedQuizCard";
import LiveQuizHub from "./LiveQuizHub";
import { useTheme } from "@mui/material/styles";

const assessmentTabs = [
    { label: "Assessments", value: "assessments" },
    { label: "Practice Quizzes", value: "fun" },
    { label: "Live Quiz", value: "live" },
    { label: "Reports", value: "reports" },
];

const quickActions = [
    {
        value: "assessments",
        eyebrow: "Create Assessment",
        text: "Formal tests with marks, schedules, and report tracking.",
    },
    {
        value: "fun",
        eyebrow: "Create Practice Quiz",
        text: "Revision-first quizzes with points, streaks, and retries.",
    },
    {
        value: "live",
        eyebrow: "Start Live Quiz",
        text: "Launch room codes, watch the leaderboard, and end with a podium.",
    },
];

const AssessmentCenter = () => {
    const [tab, setTab] = useState("assessments");
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            {
                name: "Assessment Center",
                path: "/teacher-dashboard/assessment-center",
            },
        ]);
    }, [setBreadcrumbTrail]);

    return (
        <Box
            sx={{
                minHeight: "100%",
                backgroundColor: "background.default",
                p: { xs: 2, md: 3 },
            }}
        >
            <Box sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Assessment Center
                </Typography>
                <Typography color="text.secondary">
                    Formal tests stay steady while practice quizzes can be playful.
                </Typography>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    gap: 2,
                    mb: 3,
                }}
            >
                {quickActions.map((action) => (
                    <Box
                        key={action.value}
                        onClick={() => setTab(action.value)}
                        sx={{
                            p: 2.25,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor:
                                tab === action.value
                                    ? "success.main"
                                    : "divider",
                            backgroundColor:
                                tab === action.value
                                    ? (isDark ? "#1d3525" : "#f3fbf3")
                                    : "background.paper",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                                borderColor: "success.main",
                                backgroundColor: isDark
                                    ? "rgba(76,175,80,0.12)"
                                    : "#f7fff7",
                            },
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.6,
                                color: "success.main",
                            }}
                        >
                            {action.eyebrow}
                        </Typography>
                        <Typography sx={{ mt: 1, color: "text.secondary" }}>
                            {action.text}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    backgroundColor: "background.paper",
                    overflow: "hidden",
                }}
            >
                <Tabs
                    value={tab}
                    onChange={(_, nextTab) => setTab(nextTab)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        px: 1,
                        py: 1,
                        backgroundColor: isDark ? "#252525" : "#fafafa",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        "& .MuiTab-root": {
                            minHeight: 42,
                            borderRadius: "10px 10px 0 0",
                            textTransform: "none",
                            fontWeight: 600,
                            color: "text.secondary",
                            mr: 1,
                            px: 2,
                        },
                        "& .Mui-selected": {
                            color: "#1b5e20 !important",
                            fontWeight: 700,
                            backgroundColor: isDark
                                ? "rgba(76,175,80,0.18)"
                                : "#eefbf0",

                            border: "1px solid",

                            borderColor: "success.main",

                            borderBottom: "none",
                        },
                        "& .MuiTabs-indicator": {
                            height: 3,
                            backgroundColor: theme.palette.success.main,
                        },
                    }}
                >
                    {assessmentTabs.map((item) => (
                        <Tab
                            key={item.value}
                            value={item.value}
                            label={item.label}
                        />
                    ))}
                </Tabs>

                <Box sx={{ p: { xs: 1, md: 2, mt:2 } }}>
                    {tab === "assessments" && (
                        <QuizTabs embedded experience="formal" />
                    )}
                    {tab === "fun" && <QuizTabs embedded experience="fun" />}
                    {tab === "live" && <LiveQuizHub />}
                    {tab === "reports" && <SubmittedQuizCard />}
                </Box>
            </Box>
        </Box>
    );
};

export default AssessmentCenter;
