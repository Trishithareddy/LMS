import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CachedIcon from "@mui/icons-material/Cached";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import {
    Alert,
    Box,
    Button,
    Collapse,
    FormControlLabel,
    Grid,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Switch,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import LessonsSlides from "../../Admin/AdminComponents/ManageCourse/ViewCoursesComponents/LessonsSlides";
import { BreadcrumbContext } from "../../BreadcrumbContext";
import Ebook from "../../Student/StudentComponents/Ebook";
import Practice from "../../Student/StudentComponents/Practice";
import WorksheetKeys from "../../Student/StudentComponents/WorksheetKeys";
import ChatBot from "./ChatBot";
import TeacherFooter from "./TeacherFooter";
import TeacherHeader from "./TeacherHeader";
import LabActivityPdfGrid from "./ViewChapterQuiz";
import LessonProgressActions from "./LessonProgressActions";
import ChapterTeachingProgress from "./ChapterTeachingProgress";
import { useTheme } from "@mui/material/styles";

const tabs = [
    { label: "Lesson", value: "lesson" },
    { label: "Ebook", value: "Ebook" },
    { label: "Video", value: "video" },
    { label: "Resources", value: "resources" },
    // { label: "Quiz", value: "quiz" },
    { label: "Practice", value: "practice" },
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

const MyLearning1 = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);

    const [value, setValue] = useState(tabs[1].value);
    const [chapterDetailsReceived, setChapterDetailsReceived] = useState([]);
    const [lessonSlides, setLessonSlides] = useState([]);
    const [ebookUrl, setEbookUrl] = useState("");
    // const [expandedChapters, setExpandedChapters] = useState({});
    const [expandedChapter, setExpandedChapter] = useState(null);
    const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);

    const [selectedLessonId, setSelectedLessonId] = useState(null);
    const [chapterIdReceived, setChapterIdReceived] = useState("");
    const [worksheetUrl, setWorksheetUrl] = useState(null);
    const [sidebarState, setSidebarState] = useState({
        isOpen: true,
        type: "chapter",
    });
    const [videoLessons, setVideoLessons] = useState([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [sidebarToggleName, setSidebarToggleName] = useState(false);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [selectedChapter, setSelectedChapter] = useState({});

    const [terminalDisabled, setTerminalDisabled] = useState(null);
    const [terminalOptions, setTerminalOptions] = useState(null);
    const [links, setLinks] = useState(null);
    const [linksEnabled, setLinksEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lessonProgressMap, setLessonProgressMap] = useState({});
    const [chapterAccessMap, setChapterAccessMap] = useState({});
    const [updatingAccessKey, setUpdatingAccessKey] = useState("");

    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();

    const from = location.state?.from || "batchDetails";
    const batchId = location.state?._id || "";
    const courseIdSent = location.state?.courseIdSent || "";

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Teacher Dashboard", path: "/teacher-dashboard" },

            ...(from === "studentDetails" || from === "directCourse"
                ? [{ name: "Students", path: "/teacher-dashboard/students" }]
                : []),

            ...(from === "batchDetails"
                ? [
                    {
                        name: "Batches",
                        path: "/teacher-dashboard/batches",
                        from:
                            from === "studentDetails"
                                ? "studentDetails"
                                : "batchDetails",
                    },
                ]
                : []),
            ...(from === "batchDetails" || from === "studentDetails"
                ? [
                    {
                        name: `Batch Details`,
                        path: "/teacher-dashboard/batchdetails",
                        state: {
                            _id: `${batchId}`,
                            from:
                                from === "studentDetails"
                                    ? "studentDetails"
                                    : "batchDetails",
                        },
                    },
                ]
                : []),

            {
                name: `Chapters`,
                path: "/my-learning1",
                state: {
                    courseIdSent: `${location.state.courseIdSent}`,
                    from:
                        from === "studentDetails"
                            ? "studentDetails"
                            : from === "directCourse"
                                ? "directCourse"
                                : "batchDetails",
                },
            },
        ]);
    }, []);
    useEffect(() => {
        const getCourse = async () => {
            const token = localStorage.getItem("token");
            try {
                const courseResponse = await axios.get(
                    `${import.meta.env.VITE_API_URL}/courses/${location.state.courseIdSent
                    }`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                const chapterIds = courseResponse.data.chapters;
                const chapterRequests = chapterIds.map((id) =>
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/chapters/${id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    ),
                );
                const chapterResponses = await Promise.all(chapterRequests);

                const chapters = {};
                chapterResponses.forEach((response) => {
                    const chapter = response.data;
                    chapters[chapter._id] = chapter;
                });

                setChapterDetailsReceived(chapters);
                // setChapterIdReceived(chapterIds[0]);
                if (chapterIds.length > 0) {
                    setChapterIdReceived(chapterIds[0]);
                    setSelectedChapter(chapters[chapterIds[0]] || {});
                    setExpandedChapter(chapterIds[0]);
                }

                setLoading(false);

                setLoading(false);
            } catch (error) {
                console.error(
                    "Error fetching course or chapter details:",
                    error,
                );
            }
        };
        getCourse();
    }, [location.state.courseIdSent]);

    useEffect(() => {
        const fetchChapterAccessMap = async () => {
            const token = localStorage.getItem("token");

            if (!batchId || !courseIdSent) {
                setChapterAccessMap({});
                return;
            }

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapters/batch-access-map`,
                    {
                        params: {
                            batchId,
                            courseId: courseIdSent,
                        },
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setChapterAccessMap(response.data?.accessMap || {});
            } catch (error) {
                console.error("Error fetching chapter access map:", error);
                setChapterAccessMap({});
            }
        };

        fetchChapterAccessMap();
    }, [batchId, courseIdSent]);

    useEffect(() => {
        const fetchLessonSlides = async () => {
            const distinctChapter = chapterDetailsReceived[chapterIdReceived];

            if (
                distinctChapter &&
                distinctChapter.lessons &&
                distinctChapter.lessons.length > 0
            ) {
                try {
                    const token = localStorage.getItem("token");

                    const lessonResponses = await Promise.all(
                        distinctChapter.lessons.map((lesson) => {
                            const lessonId =
                                typeof lesson === "object"
                                    ? lesson._id
                                    : lesson;
                            return axios.get(
                                `${import.meta.env.VITE_API_URL
                                }/lessons/${lessonId}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                },
                            );
                        }),
                    );

                    const allSlides = lessonResponses.flatMap((response) => {
                        if (Array.isArray(response.data)) {
                            return response.data.map((slide) => ({
                                content: slide.content,
                                speakerNotes: slide.speakerNotes || "", // Include speaker notes, use empty string if not present
                            }));
                        }
                        return [];
                    });

                    // setLessonSlides(allSlides);
                } catch (error) {
                    console.error("Error fetching lesson slides:", error);
                }
            } else {
                setLessonSlides([]);
            }
        };

        fetchLessonSlides();
        const distinctChapter = chapterDetailsReceived[chapterIdReceived];
        const terminalOptionsExtracted = distinctChapter?.terminalOptions || [];

        setEbookUrl(distinctChapter?.Ebook || "");
        setWorksheetUrl(distinctChapter?.worksheet);
        setTerminalDisabled(!distinctChapter?.terminalEnabled);

        // normalize options to lowercase so "Scratch" / "scratch" both work
        setTerminalOptions(
            terminalOptionsExtracted.map((s) => String(s).toLowerCase()),
        );
        setLinks(distinctChapter?.links || []);
        setLinksEnabled(!!distinctChapter?.linksEnabled);
    }, [chapterDetailsReceived, chapterIdReceived]);

    useEffect(() => {
        const fetchVideoLessons = async () => {
            const token = localStorage.getItem("token");
            if (chapterIdReceived && value === "video") {
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL
                        }/video/chapter/${chapterIdReceived}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                    setVideoLessons(response.data.videoLessons);
                } catch (error) {
                    console.error("Error fetching video lessons:", error);
                }
            }
        };

        fetchVideoLessons();
    }, [chapterIdReceived, value]);

    useEffect(() => {
        setSidebarToggleName(value === "video");
    }, [value]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const getSelectedChapterAccess = () =>
        chapterAccessMap[chapterIdReceived] || defaultChapterAccess;

    const updateChapterAccessSetting = async (field, nextValue) => {
        const token = localStorage.getItem("token");

        if (!batchId || !courseIdSent || !chapterIdReceived) return;

        const updateKey = `${chapterIdReceived}_${field}`;
        setUpdatingAccessKey(updateKey);

        try {
            const currentAccess = getSelectedChapterAccess();
            const payload = {
                batchId,
                courseId: courseIdSent,
                chapterId: chapterIdReceived,
                ...currentAccess,
                [field]: nextValue,
            };

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/chapters/batch-access-map`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const updatedAccess = response.data?.access;

            if (updatedAccess) {
                setChapterAccessMap((prev) => ({
                    ...prev,
                    [chapterIdReceived]: updatedAccess,
                }));
            }
        } catch (error) {
            console.error("Error updating chapter access:", error);
        } finally {
            setUpdatingAccessKey("");
        }
    };

    const handleChapterClick = (chapterId, index) => {
        setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
        setChapterIdReceived(chapterId);
        setSelectedChapterIndex(index);
        const chapter = chapterDetailsReceived[chapterId];
        setSelectedChapter(chapter);
    };

    const handleLessonClick = async (lessonId, chapterId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/lessons/${lessonId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (Array.isArray(response.data.slides)) {
                setLessonSlides(response.data.slides);
            } else {
                console.error("Unexpected response format for lesson slides");
                setLessonSlides([]);
            }
        } catch (error) {
            console.error("Error fetching lesson slides:", error);
            setLessonSlides([]);
        }
        setSelectedLessonId(lessonId);
        setChapterIdReceived(chapterId);
        setValue("lesson");
    };

    const handleSidebarControl = (action) => {
        setSidebarState((prevState) => {
            switch (action) {
                case "toggle":
                    return { ...prevState, isOpen: !prevState.isOpen };
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

    const renderTabDescription = () => {
        switch (value) {
            case "lesson":
                return selectedLessonId ? (
                    <LessonsSlides
                        key={lessonSlides
                            .map((slide) => slide.content)
                            .join(",")}
                        lessonSlides={lessonSlides}
                    />
                ) : (
                    <Typography
                        variant="h6"
                        align="center"
                        sx={{
                            mt: 4,
                            opacity: 0.6,
                        }}
                    >
                        Select a lesson to begin your learning journey.
                    </Typography>
                );
            // case "worksheet":
            //     return <WorksheetKeys worksheetUrl={worksheetUrl} />;
            case "quiz":
                return <LabActivityPdfGrid chapterId={chapterIdReceived} />;
            case "worksheet":
                if (!worksheetUrl) {
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
                                The Worksheet will be uploaded soon!
                            </Typography>
                        </div>
                    );
                }
                return (
                    <WorksheetKeys
                        key={`${chapterIdReceived}-${worksheetUrl}`}
                        worksheetUrl={worksheetUrl}
                    />
                );
            case "practice":
                if (!terminalDisabled) {
                    return (
                        <Practice
                            key={`${chapterIdReceived}-${(terminalOptions || []).join(",")}-${linksEnabled}`}
                            terminalOptions={terminalOptions}
                            links={links}
                            linksEnabled={linksEnabled}
                            isTeacher={true}
                            chapterData={{ _id: chapterIdReceived }}
                            chapterId={chapterIdReceived}
                        />
                    );
                }
                return null;
            // case "Ebook":
            //     return <Ebook ebookUrl={ebookUrl} />;
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
                return renderVideoLessons();
            case "resources":
                navigate("/teacher-dashboard/resources", {
                    state: {
                        chapterIdReceived,
                        chapterName:
                            selectedChapter?.name ||
                            chapterDetailsReceived[chapterIdReceived]?.name ||
                            "",
                        courseIdSent: `${location.state.courseIdSent}`,
                        _id: `${batchId}`,
                        from:
                            from === "studentDetails"
                                ? "studentDetails"
                                : from === "directCourse"
                                    ? "directCourse"
                                    : "batchDetails",
                    },
                });
                break;
            default:
                return null;
        }
    };

    const renderVideoLessons = () => {
        return (
            <Box
                sx={{
                    margin: "5px auto",
                    width: "70%",
                    maxWidth: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "0 20px",
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
                                backgroundColor: "black",
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
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handlePreviousVideo}
                                disabled={currentVideoIndex === 0}
                                sx={{
                                    minWidth: { xs: "60px", sm: "80px" },
                                    fontSize: { xs: "0.8rem", sm: "1rem" },
                                }}
                            >
                                <ArrowBackIosIcon />
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleNextVideo}
                                disabled={
                                    currentVideoIndex ===
                                    videoLessons.length - 1
                                }
                                sx={{
                                    minWidth: { xs: "60px", sm: "80px" },
                                    fontSize: { xs: "0.8rem", sm: "1rem" },
                                }}
                            >
                                <ArrowForwardIosIcon />
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        );
    };

    const renderStudentSidebar = () => (
        <Box>
            <Button
                onClick={() => handleSidebarControl("chapter")}
                startIcon={<CachedIcon />}
                sx={{
                    justifyContent: "center",
                    width: "100%",
                    height: "30px",
                    padding: "0",
                    textTransform: "none",
                    color: "text.primary",
                }}
            >
                <Typography variant="button" sx={{ ml: 1 }}>
                    {sidebarToggleName ? "Videos" : "Chapters"}
                </Typography>
            </Button>
            <Box
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            />
            <List>
                {[
                    "Dashboard",
                    "Batches",
                    "Students",
                    "Assessments",
                    "Announcements",
                ].map((text, index) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton
                            onClick={() =>
                                handleNavigation(
                                    `/teacher-dashboard${index === 0
                                        ? ""
                                        : `/${text.toLowerCase() === "assessments" ? "quiz-tabs" : text.toLowerCase()}`
                                    }`,
                                )
                            }
                            sx={{
                                "&:hover": {
                                    bgcolor: "action.hover",
                                }
                            }}
                        >
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    const renderChapterSidebar = () => {
        return (
            <Box>
                <Button
                    onClick={() => handleSidebarControl("student")}
                    startIcon={<CachedIcon />}
                    sx={{
                        justifyContent: "center",
                        width: "100%",
                        height: "30px",
                        padding: "0",
                        textTransform: "none",
                        color: "text.primary",
                    }}
                >
                    <Typography
                        variant="button"
                        sx={{ ml: 1, fontSize: "0.9rem" }}
                    >
                        {" "}
                        Sidebar
                    </Typography>
                </Button>
                <Box
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                />
                <List>
                    {Object.values(chapterDetailsReceived).map(
                        (chapter, index) => (
                            <React.Fragment key={chapter._id}>
                                <ListItemButton
                                    onClick={() =>
                                        handleChapterClick(chapter._id, index)
                                    }
                                    sx={{
                                        bgcolor:
                                            selectedChapterIndex === index
                                                ? "action.selected"
                                                : "transparent",
                                        "&:hover": {
                                            bgcolor: "action.hover",
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        <MenuBookIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={chapter.name}
                                        secondary={
                                            (chapterAccessMap[chapter._id] ||
                                                defaultChapterAccess)
                                                .chapterEnabled
                                                ? "Released to students"
                                                : "Locked for students"
                                        }
                                    />
                                    {!(
                                        chapterAccessMap[chapter._id] ||
                                        defaultChapterAccess
                                    ).chapterEnabled && (
                                            <LockOutlinedIcon
                                                fontSize="small"
                                                color="disabled"
                                            />
                                        )}
                                    {expandedChapter === chapter._id ? (
                                        <ExpandLess />
                                    ) : (
                                        <ExpandMore />
                                    )}
                                </ListItemButton>
                                <Collapse
                                    in={expandedChapter === chapter._id}
                                    timeout="auto"
                                    unmountOnExit
                                >
                                    <List component="div" disablePadding>
                                        {chapter.lessons &&
                                            chapter.lessons.length > 0 ? (
                                            chapter.lessons.map((lesson) => {
                                                const lessonId =
                                                    typeof lesson === "object"
                                                        ? lesson._id
                                                        : lesson;

                                                const lessonName =
                                                    typeof lesson === "object"
                                                        ? lesson.lessonName ||
                                                        lesson.name ||
                                                        "Unnamed Lesson"
                                                        : "Lesson";

                                                return (
                                                    <Box
                                                        key={lessonId}
                                                        sx={{
                                                            borderBottom:
                                                                "1px solid rgba(0,0,0,0.08)",
                                                            pb: 1,
                                                            mb: 1,
                                                        }}
                                                    >
                                                        <ListItemButton
                                                            sx={{
                                                                pl: 4,
                                                                bgcolor:
                                                                    selectedLessonId === lessonId
                                                                        ? "action.selected"
                                                                        : "transparent",
                                                                "&:hover": {
                                                                    bgcolor: "action.hover",
                                                                }
                                                            }}
                                                            onClick={() =>
                                                                handleLessonClick(
                                                                    lessonId,
                                                                    chapter._id,
                                                                )
                                                            }
                                                        >
                                                            <ListItemText
                                                                primary={
                                                                    lessonName
                                                                }
                                                            />
                                                        </ListItemButton>

                                                        <Box
                                                            sx={{
                                                                pl: 4,
                                                                pr: 1.5,
                                                            }}
                                                        >
                                                            <LessonProgressActions
                                                                lessonId={
                                                                    lessonId
                                                                }
                                                                chapterId={
                                                                    chapter._id
                                                                }
                                                                courseId={
                                                                    courseIdSent
                                                                }
                                                                batchId={
                                                                    batchId
                                                                }
                                                                initialStatus={
                                                                    lessonProgressMap[
                                                                    lessonId
                                                                    ] ||
                                                                    "not-started"
                                                                }
                                                                onStatusChange={(
                                                                    changedLessonId,
                                                                    nextStatus,
                                                                ) => {
                                                                    setLessonProgressMap(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [changedLessonId]:
                                                                                nextStatus,
                                                                        }),
                                                                    );
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                );
                                            })
                                        ) : (
                                            <ListItemButton sx={{ pl: 4 }}>
                                                <ListItemText primary="No lessons available" />
                                            </ListItemButton>
                                        )}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        ),
                    )}
                </List>
            </Box>
        );
    };
    const renderVideoTitleSidebar = () => {
        return (
            <Box>
                <Button
                    onClick={() => handleSidebarControl("student")}
                    startIcon={<CachedIcon />}
                    sx={{
                        justifyContent: "center",
                        width: "100%",
                        height: "30px",
                        padding: "0",
                        textTransform: "none",
                        color: "black",
                    }}
                >
                    <Typography variant="button" sx={{ ml: 1 }}>
                        Sidebar
                    </Typography>
                </Button>
                <Box
                    sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                />
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
                                    },
                                }}
                            >
                                <ListItemText primary={lesson.videoTitle} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
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

    const data = Object.values(chapterDetailsReceived)[0];
    const selectedChapterAccess = getSelectedChapterAccess();
    const fetchLessonProgress = async ({ batchId, courseId, chapterId }) => {
        if (!batchId || !courseId || !chapterId) return;

        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/teacher-progress/lessons`,
                {
                    params: {
                        batchId,
                        courseId,
                        chapterId,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const progressList = response.data?.progress || [];
            const nextMap = {};

            progressList.forEach((item) => {
                const lessonId =
                    typeof item.lesson === "object"
                        ? item.lesson._id
                        : item.lesson;

                if (lessonId) {
                    nextMap[lessonId] = item.status;
                }
            });

            setLessonProgressMap(nextMap);
        } catch (error) {
            console.error("Failed to fetch lesson progress:", error);
        }
    };

    useEffect(() => {
        if (!batchId || !courseIdSent || !chapterIdReceived) return;

        fetchLessonProgress({
            batchId,
            courseId: courseIdSent,
            chapterId: chapterIdReceived,
        });
    }, [batchId, courseIdSent, chapterIdReceived]);
    useEffect(() => {
        if (!batchId || !courseIdSent || !chapterIdReceived) return;

        fetchLessonProgress({
            batchId,
            courseId: courseIdSent,
            chapterId: chapterIdReceived,
        });
    }, [batchId, courseIdSent, chapterIdReceived]);

    return (
        <>
            {loading && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "100vh",
                        bgcolor: "background.default",
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
            {!loading && (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        minHeight: "100vh",
                    }}
                >
                    <TeacherHeader
                        handleSidebarToggle={() =>
                            handleSidebarControl("toggle")
                        }
                        handleLogout={handleLogout}
                    />
                    <Grid container sx={{ flex: { xs: "none", md: 1 } }}>
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
                                borderRight: 1,
                                borderColor: "divider",
                            }}
                        >
                            {renderSidebar()}
                        </Grid>
                        <Grid
                            item
                            xs={12}
                            md={sidebarState.isOpen ? 10 : 12}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                                bgcolor: "background.default",
                                color: "text.primary",
                                transition: "width 0.3s ease",
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
                                            label={tab.label}
                                            disabled={
                                                terminalDisabled &&
                                                tab.value === "practice"
                                            }
                                            sx={{ flex: "1 1 auto" }}
                                        />
                                    ))}
                                </Tabs>
                            </Box>
                            <Paper
                                variant="outlined"
                                sx={{
                                    mx: 2,
                                    mt: 1,
                                    mb: 2,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "background.paper",
                                    borderColor: "divider",
                                }}
                            >
                                <Stack
                                    direction={{ xs: "column", md: "row" }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", md: "center" }}
                                    spacing={2}
                                    sx={{ mb: 1.5 }}
                                >
                                    <Box>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontWeight: 700 }}
                                        >
                                            Student Access Controls
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Release this chapter and decide which
                                            student tabs should open for{" "}
                                            {selectedChapter?.name || "this chapter"}.
                                        </Typography>
                                    </Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={
                                                    selectedChapterAccess.chapterEnabled
                                                }
                                                onChange={(event) =>
                                                    updateChapterAccessSetting(
                                                        "chapterEnabled",
                                                        event.target.checked
                                                    )
                                                }
                                                disabled={
                                                    updatingAccessKey ===
                                                    `${chapterIdReceived}_chapterEnabled`
                                                }
                                                color="success"
                                            />
                                        }
                                        label={
                                            selectedChapterAccess.chapterEnabled
                                                ? "Chapter Released"
                                                : "Chapter Locked"
                                        }
                                    />
                                </Stack>

                                {!selectedChapterAccess.chapterEnabled && (
                                    <Alert severity="info" sx={{ mb: 1.5 }}>
                                        Students will still see the chapter name, but
                                        they cannot open its learning content until you
                                        release it.
                                    </Alert>
                                )}

                                <Grid container spacing={1}>
                                    {[
                                        {
                                            label: "Ebook",
                                            field: "ebookEnabled",
                                        },
                                        {
                                            label: "Videos",
                                            field: "videoEnabled",
                                        },
                                        {
                                            label: "Resources",
                                            field: "resourcesEnabled",
                                        },
                                        {
                                            label: "Practice",
                                            field: "practiceEnabled",
                                        },
                                    ].map((item) => (
                                        <Grid item xs={12} sm={6} md={3} key={item.field}>
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    p: 1.25,
                                                    borderRadius: 2,
                                                    bgcolor: "background.default",
                                                    borderColor: "divider",
                                                }}
                                            >
                                                <FormControlLabel
                                                    sx={{ m: 0 }}
                                                    control={
                                                        <Switch
                                                            checked={
                                                                selectedChapterAccess[
                                                                item.field
                                                                ]
                                                            }
                                                            onChange={(event) =>
                                                                updateChapterAccessSetting(
                                                                    item.field,
                                                                    event.target
                                                                        .checked
                                                                )
                                                            }
                                                            disabled={
                                                                updatingAccessKey ===
                                                                `${chapterIdReceived}_${item.field}` ||
                                                                !selectedChapterAccess.chapterEnabled
                                                            }
                                                            color="success"
                                                        />
                                                    }
                                                    label={item.label}
                                                />
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                            {value === "lesson" && (
                                <ChapterTeachingProgress
                                    chapter={
                                        chapterDetailsReceived[
                                        chapterIdReceived
                                        ] || selectedChapter
                                    }
                                    lessonProgressMap={lessonProgressMap}
                                />
                            )}
                            <ChatBot
                                sourceId={
                                    selectedChapter.pdfText || data.pdfText
                                }
                            />
                            <Box>{renderTabDescription()}</Box>
                        </Grid>
                    </Grid>
                    <TeacherFooter />
                </Box>
            )}
        </>
    );
};
export default MyLearning1;
