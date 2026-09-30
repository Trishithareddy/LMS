import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
    Alert,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

function VideoLessons() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [chapterId, setChapterId] = useState("");
    const [videoTitle, setVideoTitle] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [videoLessons, setVideoLessons] = useState([]);
    const [editingVideoId, setEditingVideoId] = useState(null);
    const [message, setMessage] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [alertType, setAlertType] = useState("success");
    const [openDialog, setOpenDialog] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);
    const location = useLocation();

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Admin Dashboard', path: '/admin-dashboard' },
            { name: 'Update Courses', path: '/admin-dashboard/update-courses' },
            { name: 'Edit Course', path: '/admin-dashboard/edit-course', state:{courseData:location.state?.courseData} },
            { name: 'Create Chapter', path: '/admin-dashboard/create-chapter', state: { chapterId: location.state?.chapterId, courseData:location.state?.courseData,courseId:location.state?.courseId,
                courseName:location.state?.courseName, from1:location.state?.from} },
            { name: 'Add video', path: '/admin-dashboard/video' },
        ]);
    
}, [location]);

    useEffect(() => {
        if (location.state && location.state.chapterId) {
            setChapterId(location.state.chapterId);
            fetchVideos(location.state.chapterId);
        }
    }, [location]);

    const fetchVideos = async (chapterId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/video/chapter/${chapterId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setVideoLessons(response.data.videoLessons || []);
        } catch (error) {
            console.error("Error fetching video lessons:", error);
        }
    };

    const handleAddOrUpdateVideo = async () => {
        if (chapterId) {
            try {
                const token = localStorage.getItem("token");
                const requestMethod = editingVideoId ? "put" : "post";
                const url = editingVideoId
                    ? `${import.meta.env.VITE_API_URL}/video/${editingVideoId}`
                    : `${import.meta.env.VITE_API_URL}/video/${chapterId}`;

                const response = await axios[requestMethod](
                    url,
                    {
                        videoTitle,
                        videoUrl,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                
                setVideoTitle("");
                setVideoUrl("");
                setEditingVideoId(null);
                fetchVideos(chapterId);
                setOpenSnackbar(true);
                setAlertType("success");
                setMessage("Video added/updated successfully.");
            } catch (error) {
                setOpenSnackbar(true);
                setAlertType("error");
                setMessage("Error adding/updating video");
                console.error(
                    editingVideoId
                        ? "Error updating video lesson:"
                        : "Error adding video lesson:",
                    error
                );
            }
        }
    };

    const handleEditVideo = (video) => {
        setVideoTitle(video.videoTitle);
        setVideoUrl(video.videoUrl);
        setEditingVideoId(video._id);
    };

    const handleDeleteVideo = async () => {
        if (videoToDelete) {
            try {
                const token = localStorage.getItem("token");
                await axios.delete(
                    `${import.meta.env.VITE_API_URL}/video/${videoToDelete}`,{
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
                fetchVideos(chapterId);
                setOpenSnackbar(true);
                setAlertType("success");
                setMessage("Video deleted successfully.");
            } catch (error) {
                setOpenSnackbar(true);
                setAlertType("error");
                setMessage("Error deleting video");
                console.error("Error deleting video lesson:", error);
            } finally {
                setOpenDialog(false);
                setVideoToDelete(null);
            }
        }
    };

    const confirmDelete = (videoId) => {
        setVideoToDelete(videoId);
        setOpenDialog(true);
    };

    return (
        <Container>
            <Box>
                <Typography variant="h5" gutterBottom>
                    {editingVideoId ? "Edit Video" : "Add New Video"}
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    label="Video Title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    required
                />
                <TextField
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    label="Vimeo Embed Code"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    required
                />

                <Button
                    sx={{ marginTop: "10px" }}
                    variant="contained"
                    onClick={handleAddOrUpdateVideo}
                >
                    {editingVideoId ? "Update Video" : "Add Video"}
                </Button>
            </Box>

            <List sx={{ marginTop: "30px", padding: "0 10px" }}>
                {videoLessons.length > 0 ? (
                    videoLessons.map((video) => (
                        <ListItem
                            key={video._id}
                            sx={{
                                borderBottom: "1px solid #ddd",
                                padding: "15px 0",
                                "&:hover": {
                                    backgroundColor: "#f5f5f5",
                                },
                            }}
                            secondaryAction={
                                <>
                                    <IconButton
                                        edge="end"
                                        aria-label="edit"
                                        onClick={() => handleEditVideo(video)}
                                        sx={{ marginRight: "10px" }}
                                        disabled={!!editingVideoId}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        aria-label="delete"
                                        onClick={() => confirmDelete(video._id)}
                                        disabled={!!editingVideoId}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </>
                            }
                        >
                            <ListItemText primary={video.videoTitle} />
                        </ListItem>
                    ))
                ) : (
                    <Typography
                        variant="body1"
                        sx={{ marginTop: "20px", textAlign: "center" }}
                    >
                        Please Add Video Lessons to View.
                    </Typography>
                )}
            </List>

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

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete? This action cannot be
                        undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleDeleteVideo} color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default VideoLessons;
