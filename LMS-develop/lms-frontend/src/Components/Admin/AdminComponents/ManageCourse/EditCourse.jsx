import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Import components from ViewCoursesComponents folder
import { BreadcrumbContext } from "../../../BreadcrumbContext";
import Ebook from "./ViewCoursesComponents/Ebook";
import LessonSlides from "./ViewCoursesComponents/LessonsSlides";
import SkillTest from "./ViewCoursesComponents/SkillTest";
import Practice from "./ViewCoursesComponents/Practice";
import VideoLessons from "./ViewCoursesComponents/VideoLessons";
import WorksheetKeys from "./ViewCoursesComponents/WorksheetKeys";

const EditCourse = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const location = useLocation();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [chapterToDelete, setChapterToDelete] = useState(null);
    const [selectedTab, setSelectedTab] = useState(0);
    const [ebookUrl, setEbookUrl] = useState("");
    const [worksheetUrl, setWorksheetUrl] = useState(""); // New state for worksheetUrl
    const token = localStorage.getItem("token");

    const [imagePreview, setImagePreview] = useState(null);
    const [newImage, setNewImage] = useState(null);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Admin Dashboard', path: '/admin-dashboard' },
            { name: 'Update Courses', path: '/admin-dashboard/update-courses' },
            { name: 'Edit Course', path: '/admin-dashboard/edit-course', state:{courseData:location.state?.courseData} }
        ]);
    }, [location]);

    useEffect(() => {
        if (location.state?.courseData) {
            setCourse(location.state.courseData);
            fetchChapters(location.state.courseData.chapters);
        } else if (location.state?.courseId) {
            fetchCourseData(location.state.courseId);
        } else {
            setErrorMessage("No course data available");
        }
    }, [location.state]);

    const fetchCourseData = async (id) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/courses/getCourseById/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCourse(response.data);
            fetchChapters(response.data.chapters);
        } catch (error) {
            console.error("Error fetching course data:", error);
            setErrorMessage("Error fetching course data");
        }
    };

    const fetchChapters = async (chapterIds) => {
        try {
            const chapterPromises = chapterIds.map((id) =>
                axios.get(`${import.meta.env.VITE_API_URL}/chapters/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );
            const chapterResponses = await Promise.all(chapterPromises);
            const chapterData = chapterResponses.map(
                (response) => response.data
            );
            setChapters(chapterData);
        } catch (error) {
            console.error("Error fetching chapter data:", error);
            setErrorMessage("Error fetching chapter data");
        }
    };

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setCourse((prevCourse) => ({
            ...prevCourse,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();

        formData.append("name", course.name);
        formData.append("description", course.description);
        formData.append("published", course.published);
        formData.append("chaptersToRemove", []);

        if (newImage) {
            formData.append("image", newImage);
        }

        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/courses/updateCourse/${course._id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            setSuccessMessage("Course updated successfully");

            setTimeout(() => {
                navigate("/admin-dashboard/update-Courses");
            }, 1000);
        } catch (error) {
            console.error("Error updating course:", error);
            setErrorMessage("Error updating course");
        }
    };

    const handleViewChapter = async (chapterId) => {
        if (selectedChapter && selectedChapter._id === chapterId) {
            setSelectedChapter(null);
            setEbookUrl("");
            setWorksheetUrl(""); // Reset worksheetUrl when deselecting a chapter
        } else {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSelectedChapter(response.data);
                setSelectedTab(0);

                setEbookUrl(response.data.Ebook || "");
                setWorksheetUrl(response.data.worksheet || ""); // Set the worksheetUrl
              

                if (!response.data.Ebook) {
                    console.warn("No Ebook found in chapter data");
                }
                if (!response.data.worksheet) {
                    console.warn("No Worksheet found in chapter data");
                }
            } catch (error) {
                console.error("Error fetching chapter details:", error);
                setErrorMessage("Error fetching chapter details");
            }
        }
    };

    const handleDeleteChapter = (chapter) => {
        setChapterToDelete(chapter);
        setOpenDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (chapterToDelete) {
            try {
                await axios.delete(
                    `${import.meta.env.VITE_API_URL}/chapters/deleteChapter/${chapterToDelete._id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setSuccessMessage(`Chapter "${chapterToDelete.name}" deleted successfully`);
                setChapters(chapters.filter((chapter) => chapter._id !== chapterToDelete._id));
                if (selectedChapter && selectedChapter._id === chapterToDelete._id) {
                    setSelectedChapter(null);
                    setEbookUrl("");
                    setWorksheetUrl("");
                }
            } catch (error) {
                console.error("Error deleting chapter:", error);
                setErrorMessage(`Error deleting chapter: ${error.response?.data?.message || error.message}`);
            }
        }
        setOpenDialog(false);
        setChapterToDelete(null);
    };

    const handleDeleteCancel = () => {
        setOpenDialog(false);
        setChapterToDelete(null);
    };

    const handleAddChapter = () => {
        navigate("/admin-dashboard/create-chapter?from=edit-course", {
            state: { courseId: course._id, courseName: course.name, courseData:location.state?.courseData },
        });
    };

    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!course) return <Typography>Loading...</Typography>;

    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper elevation={3} sx={{ p: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                <Typography variant="h4" gutterBottom align="center">
                    Edit Course
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Course Name"
                        name="name"
                        value={course.name}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={course.description}
                        onChange={handleInputChange}
                        margin="normal"
                        multiline
                        rows={4}
                    />
                    <Box sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mt: 2,
                    }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={course.published}
                                    onChange={handleInputChange}
                                    name="published"
                                    color="primary"
                                />
                            }
                            label="Published"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                bgcolor: "green",
                                "&:hover": { bgcolor: "darkgreen" },
                            }}
                        >
                            Update Course
                        </Button>
                    </Box>
                    <Box sx={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 4,
                        mt: 2,
                    }}>
                        <Box sx={{
                            width: 140,
                            height: 140,
                            overflow: "hidden",
                            borderRadius: "8px",
                        }}>
                            <img
                                src={imagePreview || course.imageUrl || "../public/CourseImage.png"}
                                alt="course image"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    transition: "transform 0.3s, box-shadow 0.3s",
                                }}
                            />
                        </Box>
                        <Box>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: "none" }}
                                id="course-image-input"
                            />
                            <label htmlFor="course-image-input">
                                <Button variant="contained" component="span">
                                    Choose New Image
                                </Button>
                            </label>
                        </Box>
                    </Box>
                </form>

                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddChapter}
                        sx={{
                            bgcolor: "green",
                            color: "white",
                            borderRadius: "20px",
                            "&:hover": { bgcolor: "darkgreen" },
                        }}
                    >
                        Add Chapter
                    </Button>
                </Box>

                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    Chapters
                </Typography>
                <List>
                    {chapters.map((chapter) => (
                        <ListItem key={chapter._id}>
                            <ListItemText primary={chapter.name} />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    aria-label="edit"
                                    onClick={() => handleAddChapter()}
                                    sx={{ mr: 1 }}
                                >
                                    <EditIcon color="primary" />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    aria-label="view"
                                    onClick={() => handleViewChapter(chapter._id)}
                                    sx={{ mr: 1 }}
                                >
                                    <VisibilityIcon
                                        color={selectedChapter && selectedChapter._id === chapter._id ? "primary" : "action"}
                                    />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => handleDeleteChapter(chapter)}
                                >
                                    <DeleteIcon color="error" />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {selectedChapter && (
                <Paper elevation={3} sx={{ mt: 4, p: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Chapter: {selectedChapter.name}
                    </Typography>
                    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs
                            value={selectedTab}
                            onChange={handleTabChange}
                            aria-label="chapter content tabs"
                            centered
                            indicatorColor="secondary"
                            textColor="secondary"
                        >
                            <Tab label="Lesson Slides" />
                            <Tab label="Video" />
                            <Tab label="Worksheet Keys" />
                            <Tab label="Ebook" />
                            <Tab label="Practice" />
                            <Tab label="Skill Test" /> 
                        </Tabs>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        {selectedTab === 0 && (
                            <LessonSlides
                                lessonSlides={selectedChapter.lessons?.flatMap((lesson) => lesson.slides) || []}
                            />
                        )}
                        {selectedTab === 1 && (
                            <VideoLessons chapterId={selectedChapter._id} />
                        )}
                        {selectedTab === 2 && (
                            <WorksheetKeys worksheetUrl={worksheetUrl} />
                        )}
                        {selectedTab === 3 && <Ebook ebookUrl={ebookUrl} />}
                        {selectedTab === 4 && (
                            <Practice practiceContent={selectedChapter.practiceContent} />
                        )}
                        {selectedTab === 5 && (
                            <SkillTest
                            chapterId={selectedChapter._id}
                            courseId={course._id} 
                            />
                        )}
                    </Box>
                </Paper>
            )}

            <Dialog
                open={openDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the chapter "{chapterToDelete?.name}"?
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

            <Snackbar
                open={!!errorMessage || !!successMessage}
                autoHideDuration={6000}
                onClose={() => {
                    setErrorMessage("");
                    setSuccessMessage("");
                }}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => {
                        setErrorMessage("");
                        setSuccessMessage("");
                    }}
                    severity={errorMessage ? "error" : "success"}
                    sx={{ width: "100%" }}
                >
                    {errorMessage || successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default EditCourse;