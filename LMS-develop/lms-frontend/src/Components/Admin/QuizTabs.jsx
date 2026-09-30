import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import * as React from "react";
import { BreadcrumbContext } from "../BreadcrumbContext";
import AllQuizzes from "./AllQuizzes";
import CreateQuiz from "./CreateQuiz";
import CreateSampleQuiz from "./CreateSampleQuiz";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

export default function QuizTabs({ embedded = false, experience = "formal" }) {
    const { setBreadcrumbTrail } = React.useContext(BreadcrumbContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [value, setValue] = React.useState("1");
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    // Sync tab with URL
    React.useEffect(() => {
        if (embedded) return;
        if (location.pathname.endsWith("view")) setValue("1");
        else if (location.pathname.endsWith("sample")) setValue("2");
        else if (location.pathname.endsWith("custom")) setValue("3");
        else setValue("1"); // default
    }, [location.pathname]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        if (!embedded) {
            if (newValue === "1") navigate("/teacher-dashboard/quiz-tabs");
            if (newValue === "2") navigate("/teacher-dashboard/quiz-tabs/sample");
            if (newValue === "3") navigate("/teacher-dashboard/quiz-tabs/custom");
        }
    };

    React.useEffect(() => {
        if (embedded) return;
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },
            { name: "Quiz Tabs", path: "/teacher-dashboard/quiz-tabs" }
        ]);
    }, []);

    return (
        <Box sx={{ width: "100%", typography: "body1" }}>
            <TabContext value={value}>
                <Box
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        px: 1,
                        pt: 1,
                        backgroundColor: "background.paper",
                    }}
                >
                    <TabList
                        onChange={handleChange}
                        aria-label="quiz tabs navigation"
                        sx={{
                            minHeight: 52,

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
                                color: `${theme.palette.success.main} !important`,
                                fontWeight: 700,
                                backgroundColor: isDark
                                    ? "rgba(76,175,80,0.15)"
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
                        <Tab
                            label={
                                experience === "formal"
                                    ? "Quiz Library"
                                    : "Practice Quiz Library"
                            }
                            value="1"
                        />
                        <Tab label="Smart Quiz Creator" value="2" />
                        <Tab label="Custom Quiz Creator" value="3" />
                    </TabList>
                </Box>
                <TabPanel
    value="1"
    sx={{
        bgcolor: "background.default",
        color: "text.primary",
    }}
>
                    <AllQuizzes experience={experience} />
                </TabPanel>
                <TabPanel
    value="2"
    sx={{
        bgcolor: "background.default",
        color: "text.primary",
    }}
>
                    <CreateSampleQuiz quizMode={experience} />
                </TabPanel>
                <TabPanel
    value="3"
    sx={{
        bgcolor: "background.default",
        color: "text.primary",
    }}
>
                    <CreateQuiz quizMode={experience} />
                </TabPanel>
            </TabContext>
        </Box>
    );
}
