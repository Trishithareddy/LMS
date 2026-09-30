// changes to make in useeffect of the mylearning for proper diplay of ebook and worksheet

import { Cancel, CheckCircle } from "@mui/icons-material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CachedIcon from "@mui/icons-material/Cached";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import {
    Box,
    Button,
    Grid,
    Alert,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import {
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
} from "@mui/material";

import axios from "axios";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import VideoPlayer from "./VideoPlayer";
import ChapterQuizInStudent from "./ChapterQuizInStudent.jsx";
import StudentResource from "./StudentResource.jsx";
import RenderQuizTab from "./RenderQuizTab.jsx";
const token = localStorage.getItem("token");

import Ebook from "./Ebook";
import LessonSlides from "./LessonSlides";
import Practice from "./Practice";
import StudentFooter from "./StudentFooter";
import StudentHeader from "./StudentHeader";
import WorksheetKeys from "./WorksheetKeys";
import { Link } from "react-router-dom";
//import { fetchStudentProfile } from "../../../api/studentApi";
import { fetchStudentProfile } from "../StudentComponents/StudentCourse";


const tabs = [
    // { label: "Lesson", value: "lesson" },
    { label: "Ebook", value: "Ebook" },
    { label: "Video", value: "video" },
    { label: "Resources", value: "resources" },
    // { label: "Quiz", value: "quiz" },
    { label: "Practice", value: "practice" },
    // { label: "skillTest", value: "skilltest" },
];

const defaultChapterAccess = {
    chapterEnabled: false,
    ebookEnabled: true,
    videoEnabled: true,
    resourcesEnabled: true,
    practiceEnabled: true,
};

const tabAccessFieldMap = {
    Ebook: "ebookEnabled",
    video: "videoEnabled",
    resources: "resourcesEnabled",
    practice: "practiceEnabled",
};

function MyLearning() {
    const [currentEbookTimer, setCurrentEbookTimer] = useState(0);
    const timerRef = useRef(null);
    const isSendingProgress = useRef(false); // Add this to track API calls

    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [value, setValue] = useState(tabs[0].value);
    const [timeInterval, setTimeInterval] = useState(5);

    const [chapterDetailsReceived, setChapterDetailsReceived] = useState({});
    const [currentLessonSlides, setCurrentLessonSlides] = useState([]);
    const [ebookUrl, setEbookUrl] = useState("");
    const [skillTest, setSkillTest] = useState(null);
    const [skillAnswers, setSkillAnswers] = useState({});
    const [skillResult, setSkillResult] = useState(null);
    const [skillLoading, setSkillLoading] = useState(false);
    const [skillAttempt, setSkillAttempt] = useState(null);


    const [sidebarState, setSidebarState] = useState({
        isOpen: true,
        type: "chapter",
    });
    const token = localStorage.getItem("token");

    const [studentNameReceived, setStudentNameReceived] = useState("");
    const [chapterIdReceived, setChapterIdReceived] = useState("");
    const [worksheetUrl, setWorksheetUrl] = useState("");
    const [videoLessons, setVideoLessons] = useState([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [sidebarToggleName, setSidebarToggleName] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [terminalDisabled, setTerminalDisabled] = useState(null);
    const [terminalOptions, setTerminalOptions] = useState(null);
    const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
    const [links, setLinks] = useState(null);
    const [linksEnabled, setLinksEnabled] = useState(false);
    // const [expandedChapters, setExpandedChapters] = useState({});
    const [expandedChapter, setExpandedChapter] = useState(null);

    const [selectedLessonId, setSelectedLessonId] = useState(null);
    const [studentData, setStudentdata] = useState({});
    const [batchName, setBatchName] = useState("");
    const [batchId, setBatchId] = useState("");
    const [courseName, setCourseName] = useState("");
    const [courseId, setCourseId] = useState("");
    const [distinctChapter, setDistinctChapter] = useState({});
    const [chapterAccessMap, setChapterAccessMap] = useState({});
    const [chapterAccessLoaded, setChapterAccessLoaded] = useState(false);
    const from = location.state?.from;
    useEffect(() => {
        const loadStudent = async () => {
            try {
                const student = await fetchStudentProfile();
                setStudentdata(student);
            } catch (err) {
                console.error("Failed to load student profile:", err);
            }
        };

        loadStudent();
    }, []);

    useEffect(() => {
        const fetchTimeInterval = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/admin/getTimeInterval`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setTimeInterval(response.data.data.timeInterval);
            } catch (error) {
                console.error("Error fetching time interval:", error);
                // Keep using default value of 5 if fetch fails
            }
        };

        fetchTimeInterval();
    }, []);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Student Dashboard", path: "/student-dashboard" },
            { name: "Courses", path: "/student-dashboard/courses" },
            ...(from === "course" || from === undefined
                ? [
                    {
                        name: "My Learning",
                        path: "/my-learning",
                        state: { from: from },
                    },
                ]
                : []),
        ]);
    }, []);


    useEffect(() => {
        if (!chapterIdReceived) return;

        const fetchSkillTest = async () => {
            try {
                setSkillLoading(true);
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/skilltest/chapter/${chapterIdReceived}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data?.enabled) {
                    setSkillTest(res.data);
                    setSkillAttempt(res.data.attempt);
                    setSkillAnswers({});
                    setSkillResult(null);
                } else {
                    setSkillTest(null);
                }
            } catch {
                setSkillTest(null);
            } finally {
                setSkillLoading(false);
            }
        };

        fetchSkillTest();
    }, [chapterIdReceived]); // ✅ this dependency is correct


    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    useEffect(() => {
        if (location.state) {
            setChapterDetailsReceived(location.state.chapterDetails);
            setStudentNameReceived(location.state.studentNameSent || "");
            setChapterIdReceived(location.state.chapterIdSent || "");

            setBatchName(location.state.batchName);
            setBatchId(location.state.batchId);
            setCourseName(location.state.courseName);
            setCourseId(location.state.courseId);
            setChapterAccessMap(location.state.chapterAccessMap || {});
            setChapterAccessLoaded(
                location.state.chapterAccessMap !== undefined
            );
        }
    }, [location]);

    useEffect(() => {
        const fetchChapterAccessMap = async () => {
            if (!batchId || !courseId || chapterAccessLoaded) {
                return;
            }

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapters/batch-access-map`,
                    {
                        params: {
                            batchId,
                            courseId,
                        },
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setChapterAccessMap(response.data?.accessMap || {});
                setChapterAccessLoaded(true);
            } catch (error) {
                console.error("Error fetching chapter access map:", error);
            }
        };

        fetchChapterAccessMap();
    }, [batchId, courseId, chapterAccessLoaded]);

    useEffect(() => {
        if (chapterDetailsReceived && chapterIdReceived) {
            const currentChapter = chapterDetailsReceived[chapterIdReceived];
            setDistinctChapter(currentChapter);
            setTerminalDisabled(!currentChapter?.terminalEnabled);
            setEbookUrl(currentChapter?.Ebook || "");
            setWorksheetUrl(currentChapter?.worksheet || "");
            setTerminalOptions(currentChapter?.terminalOptions);
            setLinks(currentChapter?.links);
            setLinksEnabled(currentChapter?.linksEnabled);
        }
    }, [chapterDetailsReceived, chapterIdReceived]);

    useEffect(() => {
        const fetchVideoLessons = async () => {
            if (
                chapterIdReceived &&
                value === "video" &&
                !videoLessons.length
            ) {
                // Added check for existing lessons
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL
                        }/video/chapter/${chapterIdReceived}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    setVideoLessons(response.data.videoLessons);
                } catch (error) {
                    console.error("Error fetching video lessons:", error);
                }
            }
        };
        fetchVideoLessons();

    }, [chapterIdReceived, value, studentData, batchId, courseId]); // Added missing dependencies

    useEffect(() => {
        setSidebarToggleName(value === "video");
    }, [value]);

    const handleChange = (event, newValue) => {
        if (!isTabEnabledForCurrentChapter(newValue)) {
            return;
        }
        // Reset video-specific states when switching away from video tab
        if (value === "video" && newValue !== "video") {
            setCurrentVideoIndex(0);
        }
        setValue(newValue);
    };
    const handleSidebarControl = (action) => {
        setSidebarState((prevState) => {
            switch (action) {
                case "toggle":
                    if (window.innerWidth <= 768) {
                        if (window.scrollY !== 0) {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            return { ...prevState, isOpen: true };
                        } else {
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            return { ...prevState, isOpen: !prevState.isOpen };
                        }
                    } else {
                        return { ...prevState, isOpen: !prevState.isOpen };
                    }
                case "student":
                case "chapter":
                    return { ...prevState, type: action };
                default:
                    return prevState;
            }
        });
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleVideoChange = (index) => {
        setCurrentVideoIndex(index);
    };

    const handleNextVideo = () => {
        if (currentVideoIndex < videoLessons.length - 1) {
            setCurrentVideoIndex((prevIndex) => prevIndex + 1);
        }
    };

    const handlePreviousVideo = () => {
        if (currentVideoIndex > 0) {
            setCurrentVideoIndex((prevIndex) => prevIndex - 1);
        }
    };

    const getChapterAccess = (chapterId) =>
        chapterAccessMap?.[chapterId] || defaultChapterAccess;

    const selectedChapterAccess = getChapterAccess(chapterIdReceived);

    const isTabEnabledForCurrentChapter = (tabValue) => {
        const field = tabAccessFieldMap[tabValue];
        if (!field) return true;
        if (!selectedChapterAccess.chapterEnabled) return false;
        if (
            tabValue === "practice" &&
            terminalDisabled
        ) {
            return false;
        }

        return Boolean(selectedChapterAccess[field]);
    };

    useEffect(() => {
        if (!selectedChapterAccess.chapterEnabled) {
            return;
        }

        if (isTabEnabledForCurrentChapter(value)) {
            return;
        }

        const nextTab = tabs.find((tab) =>
            tab.value === "practice" && terminalDisabled
                ? false
                : isTabEnabledForCurrentChapter(tab.value)
        );

        if (nextTab) {
            setValue(nextTab.value);
        }
    }, [chapterIdReceived, chapterAccessMap, terminalDisabled, value]);

    const handleChapterClick = (chapterId, index) => {
        setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
        setChapterIdReceived(chapterId);
        setSelectedChapterIndex(index);
    };
    // const handleLessonClick = async (lessonId) => {
    //     setSelectedLessonId(lessonId);
    //     setValue("lesson"); // Switch to the lesson tab

    //     try {
    //         const response = await axios.get(
    //             `${import.meta.env.VITE_API_URL}/lessons/${lessonId}`,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //             }
    //         );
    //         if (Array.isArray(response.data.slides)) {
    //             // const slides = response.data.slides.map(
    //             //     (slide) => slide.content
    //             // );
    //             setCurrentLessonSlides(response.data.slides);
    //         } else {
    //             console.error("Unexpected response format for lesson slides");
    //             setCurrentLessonSlides([]);
    //         }
    //     } catch (error) {
    //         console.error("Error fetching lesson slides:", error);
    //         setCurrentLessonSlides([]);
    //     }
    // };

    const renderMCQ = (q) => (
        <FormControl sx={{ mt: 1, pl: 3 }}>
            <RadioGroup
                value={skillAnswers[q._id] ?? ""}
                onChange={(e) =>
                    setSkillAnswers((prev) => ({
                        ...prev,
                        [q._id]: Number(e.target.value),
                    }))
                }
            >
                {q.options.map((opt, optIdx) => (
                    <FormControlLabel
                        key={optIdx}
                        value={optIdx}
                        control={<Radio />}
                        sx={{
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            mb: 1,
                            px: 2,
                            py: 1,
                        }}
                        label={
                            <Typography>
                                <strong>{String.fromCharCode(65 + optIdx)}.</strong>{" "}
                                {opt.text}
                            </Typography>
                        }
                    />
                ))}
            </RadioGroup>
        </FormControl>
    );

    const renderTrueFalse = (q) => (
        <FormControl sx={{ mt: 1, pl: 3 }}>
            <RadioGroup
                value={
                    skillAnswers[q._id] === true
                        ? "true"
                        : skillAnswers[q._id] === false
                            ? "false"
                            : ""
                }
                onChange={(e) =>
                    setSkillAnswers((prev) => ({
                        ...prev,
                        [q._id]: e.target.value === "true", // ✅ BOOLEAN
                    }))
                }
            >
                <FormControlLabel value="true" control={<Radio />} label="True" />
                <FormControlLabel value="false" control={<Radio />} label="False" />
            </RadioGroup>
        </FormControl>
    );


    const renderFillBlank = (q) => (
        <Box sx={{ mt: 1, pl: 3 }}>
            <input
                type="text"
                placeholder="Type your answer"
                value={skillAnswers[q._id] || ""}
                onChange={(e) =>
                    setSkillAnswers((prev) => ({
                        ...prev,
                        [q._id]: e.target.value,
                    }))
                }
                style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "16px",
                }}
            />
        </Box>
    );


    const handleSubmitSkillTest = async () => {
        try {
            if (!skillTest || !studentData?._id) {
                alert("Skill test or student not loaded");
                return;
            }

            const questions = Array.isArray(skillTest.questions)
                ? skillTest.questions
                : [];

            if (!questions.length) {
                alert("No questions available");
                return;
            }

            let correct = 0;

            const answers = questions.map((q) => {
                const userAnswer = skillAnswers[q._id];
                let isCorrect = false;

                // MCQ
                if (q.questionType === "MCQ") {
                    isCorrect = userAnswer === q.correctOptionIndex;
                }

                // TRUE / FALSE
                else if (q.questionType === "True or False") {
                    isCorrect = userAnswer === q.answer;
                }

                // TEXT BASED
                else {
                    isCorrect =
                        typeof userAnswer === "string" &&
                        typeof q.answer === "string" &&
                        userAnswer.trim().toLowerCase() ===
                        q.answer.trim().toLowerCase();
                }

                if (isCorrect) correct++;

                return {
                    questionId: q._id,
                    answer: userAnswer ?? null,
                    isCorrect,
                };
            });

            const total = questions.length;
            const percentage = Math.round((correct / total) * 100);

            // 🔥 SUBMIT TO BACKEND (badge logic lives there)
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/skilltest/submit`,
                {
                    skillTestId: skillTest._id,
                    answers,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // ✅ UI result
            setSkillResult({
                correct,
                total,
                percent: percentage,
            });

            // 🎖️ Badge feedback
            if (res.data?.badgeAwarded) {
                alert("🎉 Congratulations! You earned a badge!");
            }
        } catch (err) {
            if (err.response?.data?.alreadySubmitted) {
                alert("You already submitted this skill test");
            } else {
                alert("Submission failed. Please refresh.");
            }
        }

    };




    const renderTabDescription = () => {
        if (!selectedChapterAccess.chapterEnabled) {
            return (
                <Alert severity="info" sx={{ m: 2 }}>
                    This chapter is still locked. Your teacher will release it
                    after covering it in class.
                </Alert>
            );
        }

        if (
            value !== "quiz" &&
            value !== "skilltest" &&
            value !== "lesson" &&
            !isTabEnabledForCurrentChapter(value)
        ) {
            return (
                <Alert severity="info" sx={{ m: 2 }}>
                    This section will be available after your teacher enables it
                    for this chapter.
                </Alert>
            );
        }

        switch (value) {
            // case "lesson":
            //     return (
            //         <LessonSlides
            //             key={currentLessonSlides.join(",")}
            //             lessonSlides={currentLessonSlides}
            //             studentData={studentData}
            //             handleLessonClick={handleLessonClick}
            //             lessonId={selectedLessonId}
            //             timeInterval={timeInterval}
            //             // onSlideChange={onSlideChange}
            //         />
            //     );
            case "resources":
                return (
                    <StudentResource chapterIdReceived={chapterIdReceived} />
                );
            case "quiz":
                // return <ChapterQuizInStudent chapterId={chapterIdReceived} />;
                return <RenderQuizTab chapterId={chapterIdReceived} />;
            case "practice":
                if (!terminalDisabled) {
                    return (
                        <Practice
                            key={terminalOptions?.join(",")}
                            terminalOptions={terminalOptions}
                            links={links}
                            linksEnabled={linksEnabled}
                            chapterData={distinctChapter}
                            studentData={studentData}
                            isTeacher={false}
                        />
                    );
                }
                return null;
            case "skilltest":
                if (skillLoading) {
                    return <Typography align="center">Loading Skill Test...</Typography>;
                }

                if (!skillTest) {
                    return (
                        <Typography align="center" sx={{ mt: 4 }}>
                            No Skill Test assigned for this chapter.
                        </Typography>
                    );
                }

                return (
                    <Box sx={{ maxWidth: 800, mx: "auto", mt: 3 }}>
                        <Typography variant="h5">{skillTest.title}</Typography>
                        <Typography sx={{ mb: 3 }}>{skillTest.instructions}</Typography>


                        {Array.isArray(skillTest.questions) && skillTest.questions.length > 0 ? (
                            skillTest.questions.map((q, idx) => (
                                <Box key={q._id} sx={{ mb: 3 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 1,
                                        }}
                                    >
                                        <Typography fontWeight="bold">
                                            {idx + 1}.
                                        </Typography>

                                        <Box
                                            sx={{
                                                flex: 1,
                                                "& p": { margin: 0 },
                                            }}
                                            dangerouslySetInnerHTML={{ __html: q.questionStem }}
                                        />
                                    </Box>


                                    {q.questionType === "MCQ" && renderMCQ(q)}

                                    {q.questionType === "True or False" && renderTrueFalse(q)}

                                    {q.questionType === "Fill In the Blanks" && renderFillBlank(q)}

                                    {q.questionType === "Short Answer" && renderFillBlank(q)}

                                    {q.questionType === "Very Short Answer" && renderFillBlank(q)}

                                </Box>
                            ))
                        ) : (
                            <Typography align="center" sx={{ mt: 4 }}>
                                Skill Test questions are not available yet.
                            </Typography>
                        )}

                        <Button
                            variant="contained"
                            color="success"
                            disabled={
                                skillLoading ||
                                skillResult !== null ||
                                skillAttempt?.passed === true
                            }
                            onClick={handleSubmitSkillTest}
                        >
                            {skillAttempt?.passed ? "Skill Test Passed ✅" : "Submit Skill Test"}
                        </Button>
                        {skillAttempt?.passed && (
                            <Typography color="success.main" sx={{ mt: 2 }}>
                                🎉 You have already passed this skill test!
                            </Typography>
                        )}


                        {skillResult && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6">
                                    Score: {skillResult.correct} / {skillResult.total}
                                </Typography>
                                <Typography variant="h6">
                                    Percentage: {skillResult.percent}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );

            case "Ebook":
                if (!ebookUrl) {
                    return (
                        <div>
                            <Typography
                                variant="h6"
                                align="center"
                                sx={{
                                    mt: 4,
                                    fontFamily: "Georgia, serif",
                                }}
                            >
                                The eBook will be uploaded soon!
                            </Typography>
                        </div>
                    );
                }
                return (
                    <Ebook
                        key={`${chapterIdReceived}-${ebookUrl}`}
                        ebookUrl={ebookUrl}
                    />
                );

            case "video":
                if (!videoLessons?.length) return null;
                return (
                    <VideoPlayer
                        key={`${chapterIdReceived}-${value}`}
                        chapterId={chapterIdReceived}
                        studentId={studentData?._id || ""}
                        videoLessons={videoLessons}
                        currentVideoIndex={currentVideoIndex}
                        onVideoChange={handleVideoChange}
                    />
                );
            default:
                return null;
        }
    };

    const [isLoading, setIsLoading] = useState(true);

    // Modify the student details fetch useEffect
    // useEffect(() => {
    //     const fetchStudentDetails = async () => {
    //         setIsLoading(true);
    //         try {
    //             const token = localStorage.getItem("token");
    //             const response = await axios.get(
    //                 `${import.meta.env.VITE_API_URL}/student/get/details`,
    //                 {
    //                     headers: { Authorization: `Bearer ${token}` },
    //                 }
    //             );
    //             setStudentdata(response.data.student);
    //         } catch (error) {
    //             console.error("Error fetching Student Data:", error);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };

    //     fetchStudentDetails();
    // }, []);


    const sendEbookProgressToBackend = async (progressData) => {
        if (isSendingProgress.current) {
            console.log("Progress send already in progress, skipping");
            return;
        }

        try {
            isSendingProgress.current = true;
            console.log("Sending ebook progress:", progressData);
            await axios.post(
                `${import.meta.env.VITE_API_URL}/progress/ebookprogress`,
                progressData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("Ebook progress sent successfully");
        } catch (error) {
            console.error("Error sending ebook progress:", error);
        } finally {
            isSendingProgress.current = false;
        }
    };
    // Function to log ebook time
    const logEbookTime = (timeSpent) => {
        if (!studentData?._id || !chapterIdReceived) {
            console.log("Missing data, skipping log:", {
                hasStudentId: !!studentData?._id,
                hasChapterId: !!chapterIdReceived,
            });
            return;
        }

        const progressData = {
            studentId: studentData._id,
            chapterId: chapterIdReceived,
            ebooktimeSpent: timeSpent,
        };

        // Use a single API call
        sendEbookProgressToBackend(progressData);
    };

    const startEbookTimer = () => {
        if (timerRef.current) {
            console.log("Timer already running, skipping start");
            return;
        }

        setCurrentEbookTimer(0);

        timerRef.current = setInterval(() => {
            setCurrentEbookTimer((prev) => {
                const newTime = prev + 1;
                if (newTime === timeInterval) {
                    logEbookTime(timeInterval);
                    return 0;
                }
                return newTime;
            });
        }, 1000);
    };

    const stopEbookTimer = () => {
        if (!timerRef.current) {
            console.log("No timer running, skipping stop");
            return;
        }

        if (currentEbookTimer > 0) {
            logEbookTime(currentEbookTimer);
        }

        clearInterval(timerRef.current);
        timerRef.current = null;
        setCurrentEbookTimer(0);
    };

    // Add this separate useEffect for handling tab changes
    useEffect(() => {
        if (value === "Ebook" && ebookUrl) {
            console.log("Tab is Ebook and URL exists - starting timer");
            startEbookTimer();
        } else if (timerRef.current) {
            console.log("Tab changed or URL missing - stopping timer");
            stopEbookTimer();
        }
    }, [value, ebookUrl]);

    // Add cleanup effect
    useEffect(() => {
        return () => {
            console.log("Cleanup: stopping timer");
            stopEbookTimer();
        };
    }, []);


    const renderVideoLessons = () => {
        return (
            <Box
                sx={{
                    margin: "5px auto",
                    width: "100%",
                    maxWidth: "100%",
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: {
                        xs: "0 20px",
                        sm: "0 150px",
                        md: "0 200px",
                    },
                    boxSizing: "border-box",
                }}
            >
                {videoLessons.length > 0 && (
                    <>
                        <Box
                            dangerouslySetInnerHTML={{
                                __html: videoLessons[currentVideoIndex]
                                    .videoUrl,
                            }}
                            sx={{
                                width: "100%",
                                maxWidth: { xs: "100%", sm: "90%" },
                                bgcolor: "black",
                                borderRadius: "5px",
                                overflow: "hidden",
                            }}
                        />
                        <Box
                            sx={{
                                marginTop: 1,
                                display: "flex",
                                justifyContent: "space-between",
                                width: "100%",
                                maxWidth: { xs: "100%", sm: "90%" },
                            }}
                        >
                            <IconButton
                                onClick={handlePreviousVideo}
                                disabled={currentVideoIndex === 0}
                                sx={{
                                    color: "#4CAF50",
                                    bgcolor: "transparent",
                                    "&:hover": {
                                        bgcolor:
                                            "rgba(76, 175, 80, 0.1)",
                                        borderColor: "#388E3C",
                                        color: "#388E3C",
                                    },
                                    "&:disabled": {
                                        opacity: 0.5,
                                        cursor: "not-allowed",
                                    },
                                    transition: "all 0.3s ease",
                                    padding: "8px",
                                }}
                            >
                                <ArrowBackIosIcon />
                            </IconButton>
                            <IconButton
                                onClick={handleNextVideo}
                                disabled={
                                    currentVideoIndex ===
                                    videoLessons.length - 1
                                }
                                sx={{
                                    color: "#4CAF50",
                                    backgroundColor: "transparent",
                                    "&:hover": {
                                        backgroundColor:
                                            "rgba(76, 175, 80, 0.1)",
                                        borderColor: "#388E3C",
                                        color: "#388E3C",
                                    },
                                    "&:disabled": {
                                        opacity: 0.5,
                                        cursor: "not-allowed",
                                    },
                                    transition: "all 0.3s ease",
                                    padding: "8px",
                                }}
                            >
                                <ArrowForwardIosIcon />
                            </IconButton>
                        </Box>
                    </>
                )}
            </Box>
        );
    };

    const renderStudentSidebar = () => (
        <Box>
            <Box
                sx={{
                    borderRadius: "25px",
                    marginBottom: "3px",
                }}
            >
                <Button
                    onClick={() => handleSidebarControl("chapter")}
                    startIcon={<CachedIcon />}
                    sx={{
                        width: "100%",
                        justifyContent: "center",
                        textTransform: "none",

                        bgcolor: "#4CAF50 !important",
                        color: "#fff !important",
                        borderRadius: "10px",

                        "&:hover": {
                            bgcolor: "#43A047 !important",
                        },
                    }}
                >
                    <Typography variant="button" sx={{ ml: 1 }}>
                        {sidebarToggleName ? "Videos" : "Chapters"}
                    </Typography>
                </Button>
            </Box>

            <Box
                sx={{
                    borderRadius: "25px",
                    bgcolor: "divider",
                    width: "90%",
                    height: "3px",
                    margin: "0 auto",
                }}
            ></Box>

            <List>
                {[
                    "Dashboard",
                    "Courses",
                    "Assessments",
                    "Announcements",
                    "Projects",
                ].map((text, index) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton
                            onClick={() =>
                                handleNavigation(
                                    `/student-dashboard${index === 0
                                        ? ""
                                        : `/${text.toLowerCase()}`
                                    }`
                                )
                            }
                            sx={{
                                "&:hover": {
                                    bgcolor: "action.hover",
                                    color: "text.primary",
                                }
                            }}
                        >
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Box
                sx={{
                    marginBottom: "35px",
                    display: "flex",
                    justifyContent: "center",
                    marginRight: "7%",
                    zIndex: -1,
                }}
            >
                <img
                    src="/Rocket2.gif"
                    alt="Loading animation"
                    style={{
                        height: "230px",
                        width: "100%",
                        objectFit: "contain",
                        filter: "blur(5px)",
                    }}
                />
            </Box>
        </Box>
    );

    const renderChapterSidebar = () => {
        return (
            <Box>
                <Box
                    sx={{
                        borderRadius: "25px",
                        marginBottom: "3px",
                    }}
                >
                    <Button
                        onClick={() => handleSidebarControl("student")}
                        startIcon={<CachedIcon />}
                        sx={{
                            width: "100%",
                            justifyContent: "center",
                            textTransform: "none",

                            bgcolor: "#4CAF50 !important",
                            color: "#fff !important",
                            borderRadius: "10px",

                            "&:hover": {
                                bgcolor: "#43A047 !important",
                            },
                        }}
                    >
                        <Typography sx={{ color: "inherit" }}>
                            SIDEBAR
                        </Typography>
                    </Button>
                </Box>

                <Box
                    sx={{
                        borderRadius: "25px",
                        bgcolor: "divider",
                        width: "90%",
                        height: "3px",
                        margin: "0 auto",
                    }}
                ></Box>
                <List>
                    {Object.values(chapterDetailsReceived).map(
                        (chapter, index) => (
                            <React.Fragment key={chapter._id}>
                                <ListItemButton
                                    onClick={() =>
                                        handleChapterClick(chapter._id, index)
                                    }
                                    selected={index === selectedChapterIndex}
                                    sx={{
                                        "&:hover": {
                                            bgcolor: "action.hover",
                                            color: "text.primary",
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        <MenuBookIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={chapter.name}
                                        secondary={
                                            getChapterAccess(chapter._id)
                                                .chapterEnabled
                                                ? "Released"
                                                : "Locked until teacher enables"
                                        }
                                    />
                                    {!getChapterAccess(chapter._id)
                                        .chapterEnabled && (
                                            <LockOutlinedIcon
                                                fontSize="small"
                                                color="disabled"
                                            />
                                        )}
                                    {/* {expandedChapter === chapter._id ? (
                                        <ExpandLess />
                                    ) : (
                                        <ExpandMore />
                                    )} */}
                                </ListItemButton>
                                {/* <Collapse
                                    in={expandedChapter === chapter._id}
                                    timeout="auto"
                                    unmountOnExit
                                >
                                    <List component="div" disablePadding>
                                        {chapter.lessons &&
                                        chapter.lessons.length > 0 ? (
                                            chapter.lessons.map((lesson) => (
                                                <ListItemButton
                                                    key={lesson._id}
                                                    sx={{ pl: 4 }}
                                                    onClick={() =>
                                                        handleLessonClick(
                                                            lesson._id
                                                        )
                                                    }
                                                    selected={
                                                        selectedLessonId ===
                                                        lesson._id
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            lesson.lessonName ||
                                                            "Unnamed Lesson"
                                                        }
                                                    />
                                                </ListItemButton>
                                            ))
                                        ) : (
                                            <ListItemButton sx={{ pl: 4 }}>
                                                <ListItemText primary="No lessons available" />
                                            </ListItemButton>
                                        )}
                                    </List>
                                </Collapse> */}
                            </React.Fragment>
                        )
                    )}
                </List>
                <Box
                    sx={{
                        marginBottom: "35px",
                        display: "flex",
                        justifyContent: "center",
                        marginRight: "7%",
                        zIndex: -1,
                    }}
                >
                    <img
                        src="/Rocket2.gif"
                        alt="Loading animation"
                        style={{
                            height: "230px",
                            width: "100%",
                            objectFit: "contain",
                            filter: "blur(5px)",
                        }}
                    />
                </Box>
            </Box>
        );
    };
    const renderVideoTitleSidebar = () => {
        return (
            <Box>
                <Box>
                    <Box
                        sx={{
                            borderRadius: "25px",
                            marginBottom: "3px",
                        }}
                    >
                        <Button
                            onClick={() => handleSidebarControl("student")}
                            startIcon={<CachedIcon />}
                            sx={{
                                justifyContent: "center",
                                width: "100%",
                                textTransform: "none",
                                color: "text.primary",
                            }}
                        >
                            <Typography variant="button" sx={{ ml: 1 }}>
                                Sidebar
                            </Typography>
                        </Button>
                    </Box>

                    <Box
                        sx={{
                            borderRadius: "25px",
                            bgcolor: "divider",
                            width: "90%",
                            height: "3px",
                            margin: "0 auto",
                        }}
                    ></Box>
                    <List>
                        {videoLessons.map((lesson, index) => (
                            <ListItem
                                key={lesson._id}
                                disablePadding
                                selected={index === currentVideoIndex}
                            >
                                <ListItemButton
                                    onClick={() => handleVideoChange(index)}
                                    sx={{
                                        "&:hover": {
                                            bgcolor: "action.hover",
                                            color: "text.primary",
                                        }
                                    }}
                                >
                                    <ListItemText primary={lesson.videoTitle} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
                <Box
                    sx={{
                        marginBottom: "35px",
                        display: "flex",
                        justifyContent: "center",
                        marginRight: "7%",
                        zIndex: -1,
                    }}
                >
                    <img
                        src="/Rocket2.gif"
                        alt="Loading animation"
                        style={{
                            height: "230px",
                            width: "100%",
                            objectFit: "contain",
                            filter: "blur(5px)",
                        }}
                    />
                </Box>
            </Box>
        );
    };

    const renderSidebar = () => {
        if (value === "video") {
            return sidebarState.type === "student"
                ? renderStudentSidebar()
                : renderVideoTitleSidebar();
        } else {
            return sidebarState.type === "student"
                ? renderStudentSidebar()
                : renderChapterSidebar();
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                // This ensures content starts below fixed header
            }}
        >
            <StudentHeader
                handleSidebarToggle={() => handleSidebarControl("toggle")}
                studentName={studentNameReceived}
                handleLogout={handleLogout}
            />

            <Box
                component="main"
                sx={{
                    flex: 1,
                    width: "100%",
                    bgcolor: "background.default",
                }}
            >
                <Grid container sx={{ flex: { xs: "none", md: 1 } }}>
                    {/* Sidebar */}
                    <Grid
                        item
                        xs={12}
                        md={2}
                        sx={{
                            display: sidebarState.isOpen ? "flex" : "none",
                            flexDirection: "column",
                            transition: "all 0.3s ease",
                            opacity: sidebarState.isOpen ? 1 : 0,
                            width: sidebarState.isOpen ? "auto" : 0,
                            bgcolor: "background.paper",
                        }}
                    >
                        {renderSidebar()}
                    </Grid>

                    {/* Main content */}
                    <Grid
                        item
                        xs={12}
                        md={sidebarState.isOpen ? 10 : 12}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            bgcolor: "background.default",
                            transition: "width 0.3s ease",
                            paddingBottom: "10px",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <Tabs
                                value={value}
                                onChange={handleChange}
                                textColor="primary"
                                indicatorColor="primary"
                                aria-label="tabs example"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    borderBottom: 1,
                                    borderColor: "divider",

                                    "& .MuiTab-root": {
                                        color: "text.secondary",
                                        fontWeight: 600,
                                    },

                                    "& .Mui-selected": {
                                        color: "primary.main !important",
                                        fontWeight: 700,
                                    },
                                }}
                            >
                                {tabs.map((tab) => (
                                    <Tab
                                        key={tab.value}
                                        value={tab.value}
                                        label={
                                            isTabEnabledForCurrentChapter(
                                                tab.value
                                            )
                                                ? tab.label
                                                : `${tab.label} (Locked)`
                                        }
                                        disabled={
                                            !isTabEnabledForCurrentChapter(
                                                tab.value
                                            )
                                        }
                                        sx={{ flex: "1 1 auto" }}
                                    />
                                ))}
                            </Tabs>
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>{renderTabDescription()}</Box>
                    </Grid>
                </Grid>
            </Box>
            <StudentFooter />
        </Box>
    );
}

export default MyLearning;
