import {
    Alert,
    Box,
    Button,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Ebook from "../../../Student/StudentComponents/Ebook";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

// Configure axios defaults for large files
axios.defaults.maxContentLength = Number.POSITIVE_INFINITY;
axios.defaults.maxBodyLength = Number.POSITIVE_INFINITY;

// Maximum file size (32MB)
const MAX_FILE_SIZE = 32 * 1024 * 1024;

function AddLabActivity() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [file, setFile] = useState(null);
    const [chapterId, setChapterId] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [documentId, setDocumentId] = useState("");
    const [name, setName] = useState("");
    const [displayEbook, setDisplayEbook] = useState(false);
    const [error, setError] = useState("");
    const [value, setValue] = useState("file");
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Update Courses", path: "/admin-dashboard/update-courses" },
            {
                name: "Edit Course",
                path: "/admin-dashboard/edit-course",
                state: { courseData: location.state?.courseData },
            },
            {
                name: "Create Chapter",
                path: "/admin-dashboard/create-chapter",
                state: {
                    chapterId: location.state?.chapterId,
                    courseData: location.state?.courseData,
                    courseId: location.state?.courseId,
                    courseName: location.state?.courseName,
                    from1: location.state?.from,
                },
            },
            {
                name: "Add Lab Activity",
                path: "/admin-dashboard/add-lab-activity",
            },
        ]);
    }, [location, setBreadcrumbTrail]);

    useEffect(() => {
        if (location.state) {
            
            setChapterId(location.state.chapterId);
        }
    }, [location]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        setError("");
        setPdfUrl("");
        setDisplayEbook(false);
        setName("");
    };

    const validateFile = (file) => {
        if (!file) {
            throw new Error("Please select a file");
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error("File size exceeds 32MB limit");
        }

        if (!file.type.includes("pdf")) {
            throw new Error("Only PDF files are allowed");
        }
    };

    const showErrorMessage = (error) => {
        const errorMessage =
            error.response?.data?.error ||
            error.response?.data?.message ||
            error.message;
        setMessage(errorMessage || "Error processing request");
        setAlertType("error");
        setOpenSnackbar(true);
        setError(errorMessage || "An error occurred. Please try again.");
        console.error("Error details:", error.response?.data || error);
    };

    const addLabActivityByFile = () => {
        if (!chapterId) {
            console.error("Error: Chapter ID is not available.");
            return;
        }

        const handleAddLabActivity = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                setLoading(true);
                setError("");

                // Validate file
                validateFile(file);

                const formData = new FormData();
                formData.append("pdf", file);
                formData.append("chapterId", chapterId);
                formData.append("name", name);

                const response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/chapters/lab-activity/add`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            Authorization: `Bearer ${token}`,
                        },
                        onUploadProgress: (progressEvent) => {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 100) /
                                    progressEvent.total
                            );
                            setUploadProgress(percentCompleted);
                        },
                    }
                );

                
                setPdfUrl(response.data.chapter.labActivity);
                setFile(null);
                setError("");
                setMessage("Lab Activity Added Successfully");
                setAlertType("success");
                setOpenSnackbar(true);
                setUploadProgress(0);
                setName("");
            } catch (error) {
                showErrorMessage(error);
            } finally {
                setLoading(false);
            }
        };

        return (
            <Box sx={{ marginTop: "20px" }}>
                <Typography sx={{ marginBottom: "10px" }}>
                    Upload Lab Activity (Maximum size: 32MB)
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    type="file"
                    inputProps={{
                        accept: ".pdf",
                    }}
                    onChange={(e) => setFile(e.target.files[0])}
                    disabled={loading}
                />
                <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Lab Activity Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    sx={{ mt: 2, mb: 2 }}
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                    <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
                        <CircularProgress
                            variant="determinate"
                            value={uploadProgress}
                        />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            {uploadProgress}% Uploaded
                        </Typography>
                    </Box>
                )}
                <Button
                    variant="contained"
                    sx={{ marginTop: "10px" }}
                    onClick={handleAddLabActivity}
                    disabled={loading || !file || !name}
                >
                    {loading ? (
                        <CircularProgress size={24} />
                    ) : (
                        "Add Lab Activity"
                    )}
                </Button>
                {error && (
                    <Typography color="error" mt={2}>
                        {error}
                    </Typography>
                )}
                <Box>{pdfUrl && <Ebook ebookUrl={pdfUrl} />}</Box>
            </Box>
        );
    };

    const addLabActivityById = () => {
        if (!chapterId) {
            console.error("Error: Chapter ID is not available.");
            return;
        }

        const handleAddLabActivityById = async () => {
            if (!documentId.trim() || !name.trim()) {
                setError("Please enter both document ID and name");
                return;
            }

            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                setLoading(true);
                const data = {
                    chapterId: chapterId,
                    cloudPdfDocumentId: documentId,
                    name: name,
                };

                const response = await axios.post(
                    `${
                        import.meta.env.VITE_API_URL
                    }/chapters/lab-activity/add-by-id`,
                    data,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                
                setDisplayEbook(true);
                setDocumentId("");
                setName("");
                setError("");
                setMessage("Lab Activity Added Successfully");
                setAlertType("success");
                setOpenSnackbar(true);
            } catch (error) {
                showErrorMessage(error);
            } finally {
                setLoading(false);
            }
        };

        return (
            <Box sx={{ marginTop: "20px" }}>
                <Typography sx={{ marginBottom: "10px" }}>
                    Add Lab Activity by Document ID
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Document ID"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Lab Activity Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    sx={{ mt: 2, mb: 2 }}
                />
                <Button
                    variant="contained"
                    sx={{ marginTop: "10px" }}
                    onClick={handleAddLabActivityById}
                    disabled={loading || !documentId.trim() || !name.trim()}
                >
                    {loading ? (
                        <CircularProgress size={24} />
                    ) : (
                        "Add Lab Activity"
                    )}
                </Button>
                {error && (
                    <Typography color="error" mt={2}>
                        {error}
                    </Typography>
                )}
                <Box>{displayEbook && <Ebook ebookUrl={documentId} />}</Box>
            </Box>
        );
    };

    const renderTabs = () => {
        if (value === "file") {
            return addLabActivityByFile();
        }

        if (value === "documentId") {
            return addLabActivityById();
        }
    };

    return (
        <Box
            sx={{
                width: "80%",
                marginLeft: "10%",
                marginBottom: "20px",
            }}
        >
            <Tabs
                value={value}
                onChange={handleChange}
                textColor="secondary"
                indicatorColor="secondary"
                aria-label="tabs example"
                variant="scrollable"
                scrollButtons="auto"
                sx={{ flexWrap: "wrap" }}
            >
                <Tab value="file" label="Add Lab Activity file" />
                <Tab value="documentId" label="Add Lab Activity by ID" />
            </Tabs>
            {renderTabs()}
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
        </Box>
    );
}

export default AddLabActivity;
