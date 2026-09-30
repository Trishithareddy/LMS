import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import UploadFileIcon from "@mui/icons-material/UploadFile";
// import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import {
    Alert,
    Box,
    Button,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Snackbar,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

const fixedListItems = [
    "Lesson",
    "E-Book",
    "Video",
    "Worksheet",
    "Quiz",
    "Skill Test",
    "Resources",
    "LabActivity",
    // "Assignment",
    "Terminal",

];

const ChapterMainSection = () => {
    const location = useLocation();
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const searchParams = new URLSearchParams(location.search);
    const from = searchParams.get('from');
    const [chapters, setChapters] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [courseName, setCourseName] = useState("");
    const [courseId, setCourseId] = useState("");
    const [chapterName, setChapterName] = useState("");
    const [isChapterSaved, setIsChapterSaved] = useState(false);
    const [isAddingChapter, setIsAddingChapter] = useState(false);
    const [message, setMessage] = useState("");
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openNameDialog, setOpenNameDialog] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState(null);
    const [alertType, setAlertType] = useState("success");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [selectedChapterId, setSelectedChapterId] = useState(null);
    const [newChapterName, setNewChapterName] = useState("");
    const [lessonName, setLessonName] = useState("");
    const [openLessonRenameDialog, setOpenLessonRenameDialog] = useState(false);
    const [newLessonName, setNewLessonName] = useState("");
    const [selectedLesson, setSelectedLesson] = useState([]);
    const [importingPptChapterId, setImportingPptChapterId] = useState(null);
    const [importingPdfChapterId, setImportingPdfChapterId] =
        useState(null);
    const from1 = location.state?.from1

    const navigate = useNavigate();

    useEffect(() => {
        if (from === 'edit-course' || from1 === "edit-course") {
            setBreadcrumbTrail([
                { name: 'Admin Dashboard', path: '/admin-dashboard' },
                { name: 'Update Courses', path: '/admin-dashboard/update-courses' },
                { name: 'Edit Course', path: '/admin-dashboard/edit-course', state: { courseData: location.state?.courseData } },
                { name: 'Create Chapter', path: '/admin-dashboard/create-chapter' }
            ]);
        } else if (from === 'create-course') {
            setBreadcrumbTrail([
                { name: 'Admin Dashboard', path: '/admin-dashboard' },
                { name: 'Create Course', path: '/admin-dashboard/create-course' },
                { name: 'Create Chapter', path: '/admin-dashboard/create-chapter' }
            ]);
        } else {
            // Default fallback if accessed directly
            setBreadcrumbTrail([
                { name: 'Admin Dashboard', path: '/admin-dashboard' },
                { name: 'Create Chapter', path: '/admin-dashboard/create-chapter' }
            ]);
        }
    }, [location]);

    useEffect(() => {
        if (location.state) {
            setCourseId(location.state.courseId);
            setCourseName(location.state.courseName);
        }
    }, [location]);

    useEffect(() => {
        if (courseId) {
            fetchChapters();
            fetchLessonsByChapter();
        }
    }, [courseId]);

    const fetchChapters = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/${courseId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const chaptersWithDetails = await Promise.all(
                response.data.chapters.map(async (chapterId) => {
                    const chapterResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    return { ...chapterResponse.data, open: false };
                })
            );
            setChapters(chaptersWithDetails);
        } catch (error) {
            console.error("Error fetching chapters:", error);
            setMessage("Error fetching chapters");
            setAlertType("error");
            setOpenSnackbar(true);
        }
    };

    const fetchLessonsByChapter = async () => {
        try {
            const token = localStorage.getItem("token");
            const courseResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/${courseId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const chapters = courseResponse.data.chapters;

            const lessonByChapter = await Promise.all(
                chapters.map(async (chapterId) => {
                    const response = await axios.get(
                        `${import.meta.env.VITE_API_URL
                        }/lessons/lessons/${chapterId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    return {
                        ...response.data,
                        open: false,
                        chapterId: chapterId,
                    };
                })
            );
            setLessons(lessonByChapter);
        } catch (error) {
            console.error("Error fetching lessons:", error);
            setMessage("Error fetching lessons");
            setAlertType("error");
            setOpenSnackbar(true);
        }
    };

    const handleChapterOpenDialog = (chapter) => {
        setSelectedChapterId(chapter._id);
    };

    const handleChapterCloseDialog = () => {
        setSelectedChapterId(null);
    };

    const handleSaveChapterName = async () => {
        if (!chapterName.trim()) {
            setMessage("Chapter name cannot be empty!");
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL
                }/chapters/${courseId}/addChapter`,
                { name: chapterName },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setMessage("Chapter name saved successfully!");
            setAlertType("success");
            setChapters([
                ...chapters,
                { _id: response.data._id, name: chapterName, open: false },
            ]);
            setIsChapterSaved(true);
            setIsAddingChapter(false);
            setChapterName("");
        } catch (error) {
            setMessage("Error saving chapter name.");
            setAlertType("error");
        } finally {
            setOpenSnackbar(true);
        }
    };

    const handleChapterClick = (id) => {
        setChapters(
            chapters.map((chapter) =>
                chapter._id === id
                    ? { ...chapter, open: !chapter.open }
                    : { ...chapter, open: false }
            )
        );
        const selectedChapterFilter = chapters.filter((chapter) =>
            chapter._id === id

        )

        setSelectedChapterId(selectedChapterFilter[0]._id);
    };

    const handleLessonClick = (chapterId) => {
        setLessons(
            lessons.map((lesson) =>
                lesson.chapterId === chapterId
                    ? { ...lesson, open: !lesson.open }
                    : lesson
            )
        );
    };

    const handleListItemClick = (item, chapterId) => {
        switch (item) {
            // case "Lesson":
            //     navigate("/admin-dashboard/lesson-slides", {
            //         state: { chapterId },
            //     });
            case "E-Book":
                navigate("/admin-dashboard/add-ebook", {
                    state: {
                        chapterId, courseData: location.state?.courseData, courseId: location.state?.courseId,
                        courseName: location.state?.courseName, from: "edit-course"
                    }
                });
                break;
            case "Worksheet":
                navigate("/admin-dashboard/add-worksheet", {
                    state: {
                        chapterId, courseData: location.state?.courseData, courseId: location.state?.courseId,
                        courseName: location.state?.courseName, from: "edit-course"
                    }
                });
                break;
            case "Video":
                navigate("/admin-dashboard/video", {
                    state: {
                        chapterId, courseData: location.state?.courseData, courseId: location.state?.courseId,
                        courseName: location.state?.courseName, from: "edit-course"
                    }
                });
                break;
            case "Quiz":
                navigate(`/admin-dashboard/create-chapterquiz/${chapterId}`, {
                    state: {
                        chapterId, courseData: location.state?.courseData, courseId: location.state?.courseId,
                        courseName: location.state?.courseName, from: "edit-course"
                    }
                });
                break;
            case "Skill Test":
                navigate("/admin-dashboard/skill-test", {
                    state: {
                        chapterId,
                        courseId: location.state?.courseId,
                        courseName: location.state?.courseName,
                        courseData: location.state?.courseData,
                        from: "edit-course"
                    }
                });
                break;
            case "Resources":
                navigate("/admin-dashboard/add-resources", {
                    state: {
                        chapterId, courseData: location.state?.courseData, courseId: location.state?.courseId,
                        courseName: location.state?.courseName, from: "edit-course"
                    }
                });
                break;
            case "LabActivity":
                navigate("/admin-dashboard/add-lab-activity", {
                    state: {
                        chapterId, courseData: location.state?.courseData, courseId: location.state?.courseId,
                        courseName: location.state?.courseName, from: "edit-course"
                    }
                });
                break;
            case "Terminal":
                navigate("/admin-dashboard/terminal", {
                    state: {
                        chapterId, courseData: location.state?.courseData, courseId: location.state?.courseId,
                        courseName: location.state?.courseName, from: "edit-course"
                    }
                });
                break;
            default:
                break;
        }
    };

    const addChapter = () => {
        setIsAddingChapter(true);
        setIsChapterSaved(false);
    };

    const handleSaveRename = async () => {
        if (selectedChapterId) {
            try {
                const token = localStorage.getItem("token");
                await axios.put(
                    `${import.meta.env.VITE_API_URL
                    }/chapters/updateChapter/${selectedChapterId}`,
                    { name: newChapterName },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setChapters(
                    chapters.map((chapter) =>
                        chapter._id === selectedChapterId
                            ? { ...chapter, name: newChapterName }
                            : chapter
                    )
                );
                setMessage("Chapter renamed successfully!");
                setAlertType("success");
                setRenameDialogOpen(false);
            } catch (error) {
                setMessage("Error renaming chapter.");
                setAlertType("error");
            } finally {
                setOpenSnackbar(true);
            }
        }
    };

    const handleRenameClick = (chapterId, chapterName) => {
        setRenameDialogOpen(true);
        setNewChapterName(chapterName);
        setSelectedChapterId(chapterId);
    };

    const handleDeleteLesson = (lesson) => {
        setLessonToDelete(lesson);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (lessonToDelete) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(
                    `${import.meta.env.VITE_API_URL}/lessons/deletelesson/${lessonToDelete._id
                    }`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                // setSuccessMessage(`Lesson "${lessonToDelete.lessonName}" deleted successfully`);
                setChapters(
                    lessons.filter(
                        (lesson) => lesson._id !== lessonToDelete._id
                    )
                );
                // if (selectedChapter && selectedChapter._id === chapterToDelete._id) {
                //     setSelectedChapter(null);
                // }
                fetchChapters();
                fetchLessonsByChapter();
            } catch (error) {
                console.error("Error deleting lesson:", error);
            }
        }
        setOpenDeleteDialog(false);
        setLessonToDelete(null);
    };

    const handleDeleteCancel = () => {
        setOpenDeleteDialog(false);
        setLessonToDelete(null);
    };

    const handleAddLesson = (lesson) => {
        setLessonToDelete(lesson);

        setOpenNameDialog(true);
    };

    const handleNameConfirm = async (chapterId) => {
        if (lessonName) {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/lessons/addlesson`,
                    {
                        chapterId,
                        lessonName,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );


                fetchChapters(); // To refresh chapters
                fetchLessonsByChapter(chapterId); // To refresh lessons for the specific chapter
            } catch (error) {
                console.error("Error adding lesson:", error);
            }
        } else {
            console.error("Lesson name is required to add a lesson");
        }
        setOpenNameDialog(false);
    };

    const handleNameCancel = () => {
        setOpenNameDialog(false);
    };

    const handlePptImport = async (chapterId, event) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        const lowerName = file.name.toLowerCase();
        if (!lowerName.endsWith(".ppt") && !lowerName.endsWith(".pptx")) {
            setMessage("Please upload a PPT or PPTX file.");
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }

        try {
            setImportingPptChapterId(chapterId);
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("ppt", file);
            formData.append("chapterId", chapterId);
            formData.append("mode", "create");
            formData.append(
                "lessonName",
                file.name
                    .replace(/\.[^/.]+$/, "")
                    .replace(/[_-]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim(),
            );

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/lessons/import-ppt`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                },
            );

            setMessage(response.data?.message || "PPT imported successfully.");
            setAlertType("success");
            fetchChapters();
            fetchLessonsByChapter();
        } catch (error) {
            console.error("Error importing PPT:", error);
            setMessage(
                error.response?.data?.message ||
                "PPT import failed. Please try again.",
            );
            setAlertType("error");
        } finally {
            setImportingPptChapterId(null);
            setOpenSnackbar(true);
        }
    };

    const handlePdfImport = async (chapterId, event) => {
        const file = event.target.files?.[0];

        event.target.value = "";

        if (!file) return;

        const lowerName = file.name.toLowerCase();

        if (!lowerName.endsWith(".pdf")) {
            setMessage("Please upload a PDF file.");
            setAlertType("error");
            setOpenSnackbar(true);
            return;
        }

        try {
            setImportingPdfChapterId(chapterId);

            const token = localStorage.getItem("token");

            const formData = new FormData();

            formData.append("pdf", file);
            formData.append("chapterId", chapterId);
            formData.append("mode", "create");

            formData.append(
                "lessonName",
                file.name
                    .replace(/\.[^/.]+$/, "")
                    .replace(/[_-]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
            );

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/lessons/import-pdf`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessage(
                response.data?.message ||
                "PDF imported successfully."
            );

            setAlertType("success");

            fetchChapters();
            fetchLessonsByChapter();

        } catch (error) {
            console.error(
                "Error importing PDF:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "PDF import failed. Please try again."
            );

            setAlertType("error");

        } finally {
            setImportingPdfChapterId(null);
            setOpenSnackbar(true);
        }
    };

    const handleLessonRenameClick = (lessonName) => {
        setNewLessonName(lessonName);
        setOpenLessonRenameDialog(true);
    };

    const handleLessonRenameCancel = () => {
        setOpenLessonRenameDialog(false);
    };

    const handleLessonRenameConfirm = async () => {
        if (newLessonName) {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/lessons/lessons/${selectedLesson._id
                    }`,
                    {
                        lessonName: newLessonName, // The new lesson name
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                setLessons((prevLessons) =>
                    prevLessons.map((chapter) =>
                        // Check if the chapter contains the lesson being updated
                        chapter.chapterId === selectedChapterId
                            ? {
                                ...chapter,
                                lessons: chapter.lessons.map((lesson) =>
                                    // Update the lesson name if it's the selected lesson
                                    lesson._id === selectedLesson._id
                                        ? {
                                            ...lesson,
                                            lessonName: newLessonName,
                                        }
                                        : lesson
                                ),
                            }
                            : chapter
                    )
                );

                setMessage("Lesson renamed successfully!");
                setAlertType("success");
                setOpenLessonRenameDialog(false); // Close modal after saving
            } catch (error) {
                setMessage("Error renaming lesson.");
                setAlertType("error");
            } finally {
                setOpenSnackbar(true);
            }
        }
    };

    return (
        <>
            <Dialog
                open={openLessonRenameDialog}
                onClose={handleLessonRenameCancel}
                PaperProps={{
                    style: {
                        width: "350px",
                        height: "230px",
                    },
                }}
            >
                <DialogTitle>Rename Lesson</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Lesson Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newLessonName}
                        onChange={(e) => setNewLessonName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleLessonRenameCancel}
                        variant="contained"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleLessonRenameConfirm()}
                        variant="contained"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openDeleteDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the lesson "
                        {lessonToDelete?.lessonName}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleDeleteCancel}
                        color="primary"
                        startIcon={<CancelIcon />}
                    >
                        No
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        autoFocus
                        startIcon={<CheckCircleIcon />}
                    >
                        Yes
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openNameDialog}
                onClose={handleNameCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{
                    "& .MuiPaper-root": { borderRadius: "8px", width: "30vw" },
                }}
            >
                <DialogTitle id="alert-dialog-title">
                    {"Lesson Name"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        placeholder="Add lesson name"
                        autoFocus
                        margin="dense"
                        id="lessonName"
                        // label="Lesson Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={lessonName} // Controlled input, you'll need to define lessonName in state
                        onChange={(e) => setLessonName(e.target.value)} // Update state when input changes
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleNameCancel}
                        color="primary"
                        startIcon={<CancelIcon />}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleNameConfirm(selectedChapterId)}
                        color="error"
                        autoFocus
                        startIcon={<CheckCircleIcon />}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Box
                sx={{
                    width: "80%",
                    textAlign: "center",
                    marginLeft: "10%",
                    marginBottom: "20px",
                }}
            >
                <Typography variant="h4">{courseName}</Typography>
            </Box>
            {isAddingChapter && (
                <Box sx={{ mb: 3, width: "80%", marginLeft: "10%" }}>
                    <TextField
                        label="Chapter Name"
                        variant="outlined"
                        fullWidth
                        value={chapterName}
                        onChange={(e) => setChapterName(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 2 }}
                        onClick={handleSaveChapterName}
                        disabled={isChapterSaved}
                    >
                        Save Chapter Name
                    </Button>
                </Box>
            )}
            {chapters.length !== 0 ? (
                <Box
                    sx={{
                        width: "80%",
                        bgcolor: "whitesmoke",
                        marginLeft: "10%",
                    }}
                >
                    <List
                        component="nav"
                        aria-labelledby="nested-list-subheader"
                    >
                        {chapters.map((chapter) => (
                            <React.Fragment key={chapter._id}>
                                <ListItemButton
                                    onClick={() =>
                                        handleChapterClick(chapter._id)
                                    }
                                    sx={{ mb: 1, pl: 2, pr: 2 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <MenuBookIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={chapter.name}
                                        sx={{ ml: 1 }}
                                    />
                                    <IconButton
                                        edge="end"
                                        aria-label="rename"
                                        sx={{ mx: 1 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRenameClick(
                                                chapter._id,
                                                chapter.name
                                            );
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    {chapter.open ? (
                                        <ExpandLess
                                            onClick={() =>
                                                handleChapterCloseDialog()
                                            }
                                        />
                                    ) : (
                                        <ExpandMore
                                            onClick={() =>
                                                handleChapterOpenDialog(chapter)
                                            }
                                        />
                                    )}
                                </ListItemButton>
                                <Collapse
                                    in={chapter.open}
                                    timeout="auto"
                                    unmountOnExit
                                >
                                    <List component="div" disablePadding>
                                        {fixedListItems.map((item, index) => (
                                            <div
                                                key={`${chapter._id}-${index}`}
                                            >
                                                <ListItemButton
                                                    sx={{ pl: 4 }}
                                                    onClick={() =>
                                                        item === "Lesson"
                                                            ? handleLessonClick(
                                                                chapter._id
                                                            )
                                                            : handleListItemClick(
                                                                item,
                                                                chapter._id
                                                            )
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={item}
                                                    />
                                                    {item === "Lesson" && (
                                                        <>
                                                            <IconButton>
                                                                <AddIcon
                                                                    onClick={() =>
                                                                        handleAddLesson()
                                                                    }
                                                                />
                                                            </IconButton>
                                                            {/* PPT IMPORT */}
                                                            <Tooltip
                                                                title={
                                                                    importingPptChapterId === chapter._id
                                                                        ? "Importing PPT..."
                                                                        : "Import Lesson PPT"
                                                                }
                                                            >
                                                                <span>
                                                                    <IconButton
                                                                        component="label"
                                                                        disabled={
                                                                            importingPptChapterId === chapter._id ||
                                                                            importingPdfChapterId === chapter._id
                                                                        }
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        sx={{
                                                                            ml: 1,
                                                                            border: "1px solid #777",
                                                                            borderRadius: "6px",
                                                                            width: 42,
                                                                            height: 32,
                                                                            padding: 0,
                                                                        }}
                                                                    >
                                                                        <UploadFileIcon sx={{ fontSize: 21 }} />

                                                                        <input
                                                                            hidden
                                                                            type="file"
                                                                            accept=".ppt,.pptx"
                                                                            onChange={(e) =>
                                                                                handlePptImport(chapter._id, e)
                                                                            }
                                                                        />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>

                                                            {/* PDF IMPORT */}
                                                            <Tooltip
                                                                title={
                                                                    importingPdfChapterId === chapter._id
                                                                        ? "Importing PDF..."
                                                                        : "Import Lesson PDF"
                                                                }
                                                            >
                                                                <span>
                                                                    <IconButton
                                                                        component="label"
                                                                        disabled={
                                                                            importingPptChapterId === chapter._id ||
                                                                            importingPdfChapterId === chapter._id
                                                                        }
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        sx={{
                                                                            ml: 1,
                                                                            border: "1px solid #d32f2f",
                                                                            borderRadius: "6px",
                                                                            width: 42,
                                                                            height: 32,
                                                                            padding: 0,
                                                                            color: "#d32f2f",
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: "11px",
                                                                                fontWeight: 700,
                                                                                lineHeight: 1,
                                                                            }}
                                                                        >
                                                                            PDF
                                                                        </Typography>

                                                                        <input
                                                                            hidden
                                                                            type="file"
                                                                            accept=".pdf,application/pdf"
                                                                            onChange={(e) =>
                                                                                handlePdfImport(chapter._id, e)
                                                                            }
                                                                        />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            {lessons.find(
                                                                (l) =>
                                                                    l.chapterId ===
                                                                    chapter._id
                                                            )?.open ? (
                                                                <ExpandLess />
                                                            ) : (
                                                                <ExpandMore />
                                                            )}
                                                        </>
                                                    )}
                                                </ListItemButton>
                                                {item === "Lesson" && (
                                                    <Collapse
                                                        in={
                                                            lessons.find(
                                                                (l) =>
                                                                    l.chapterId ===
                                                                    chapter._id
                                                            )?.open
                                                        }
                                                        timeout="auto"
                                                        unmountOnExit
                                                    >
                                                        <List
                                                            component="div"
                                                            disablePadding
                                                        >
                                                            {lessons
                                                                .find(
                                                                    (l) =>
                                                                        l.chapterId ===
                                                                        chapter._id
                                                                )
                                                                ?.lessons.map(
                                                                    (
                                                                        lesson
                                                                    ) => (
                                                                        <ListItemButton
                                                                            key={
                                                                                lesson._id
                                                                            }
                                                                            sx={{
                                                                                pl: 6,
                                                                            }}
                                                                        >
                                                                            <ListItemIcon>
                                                                                <MenuBookIcon />
                                                                            </ListItemIcon>
                                                                            <ListItemText
                                                                                primary={
                                                                                    lesson.lessonName
                                                                                }
                                                                            />
                                                                            <IconButton
                                                                                edge="end"
                                                                                aria-label="rename"
                                                                                sx={{
                                                                                    mx: 1,
                                                                                }}
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedLesson(
                                                                                        lesson
                                                                                    );
                                                                                    handleLessonRenameClick(
                                                                                        lesson.lessonName
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <EditIcon />
                                                                            </IconButton>
                                                                            <IconButton>
                                                                                <OpenInNewIcon
                                                                                    onClick={() =>
                                                                                        navigate(
                                                                                            "/admin-dashboard/lesson-slides",
                                                                                            {
                                                                                                state: {
                                                                                                    lesson,
                                                                                                    courseData: location.state?.courseData, courseId: location.state?.courseId,
                                                                                                    courseName: location.state?.courseName, from: "edit-course"
                                                                                                },
                                                                                            }
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </IconButton>
                                                                            <IconButton>
                                                                                <DeleteIcon
                                                                                    onClick={() =>
                                                                                        handleDeleteLesson(
                                                                                            lesson
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </IconButton>
                                                                        </ListItemButton>
                                                                    )
                                                                )}
                                                        </List>
                                                    </Collapse>
                                                )}
                                            </div>
                                        ))}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        ))}
                    </List>
                </Box>
            ) : (
                <Box
                    sx={{
                        width: "80%",
                        textAlign: "center",
                        marginLeft: "10%",
                        marginTop: "20px",
                    }}
                >
                    <Typography variant="body1">
                        No chapters available for this course.
                    </Typography>
                </Box>
            )}
            <Box
                sx={{
                    width: "80%",
                    textAlign: "right",
                    marginLeft: "10%",
                    marginBottom: "20px",
                }}
            >
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addChapter}
                    sx={{ mt: 2, width: "auto" }}
                >
                    Add Chapter
                </Button>
            </Box>

            <Dialog
                open={renameDialogOpen}
                onClose={() => setRenameDialogOpen(false)}
                PaperProps={{
                    style: {
                        width: "350px",
                        height: "230px",
                    },
                }}
            >
                <DialogTitle>Rename Chapter</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Chapter Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setRenameDialogOpen(false)}
                        variant="contained"
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSaveRename} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={alertType}
                    sx={{ width: "100%" }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ChapterMainSection;
