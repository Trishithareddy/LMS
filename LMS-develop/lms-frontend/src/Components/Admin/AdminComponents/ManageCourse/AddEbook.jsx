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
import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Ebook from "../../../Student/StudentComponents/Ebook";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

// Configure axios defaults for large files
axios.defaults.maxContentLength = Number.POSITIVE_INFINITY;
axios.defaults.maxBodyLength = Number.POSITIVE_INFINITY;

// Maximum file size (32MB)
const MAX_FILE_SIZE = 32 * 1024 * 1024;

function AddEbook() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [file, setFile] = useState(null);
    const [chapterId, setChapterId] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [documentId, setDocumentId] = useState("");
    const [displayEbook, setDisplayEbook] = useState(false);
    const [error, setError] = useState("");
    const [value, setValue] = useState("ebook");
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [expectedTime, setExpectedTime] = useState("");
    const isAiraIndexingFix = location.state?.reason === "aira-indexing";
    const [chapterName, setChapterName] = useState(location.state?.chapterName || "");
    const [courseName, setCourseName] = useState(location.state?.courseName || "");

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
            { name: "Add Ebook", path: "/admin-dashboard/add-ebook" },
        ]);
    }, [location, setBreadcrumbTrail]);

    useEffect(() => {
        if (location.state) {

            setChapterId(location.state.chapterId);
            setChapterName(location.state.chapterName || "");
            setCourseName(location.state.courseName || "");
        }
    }, [location]);

    useEffect(() => {
        const fetchChapterName = async () => {
            if (!chapterId || chapterName) return;
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setChapterName(response.data?.name || "");
                setCourseName((current) => current || response.data?.courseName || "");
            } catch (error) {
                console.error("Unable to fetch chapter name:", error);
            }
        };

        fetchChapterName();
    }, [chapterId, chapterName]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        setError("");
        setPdfUrl("");
        setDisplayEbook(false);
        setExpectedTime("");
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

    const addEbookByFile = () => {
        // if (!chapterId) {
        //     console.error("Error: Chapter ID is not available.");
        //     return;
        // }

        const handleAddBook = async () => {
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
                formData.append("ebook", file);
                formData.append("chapterId", chapterId);
                formData.append(
                    "EbookExpectedtime",
                    expectedTime ? Number.parseInt(expectedTime, 10) : 0
                );

                const response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/chapters/addEbook`,
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


                setPdfUrl(response.data.chapter.Ebook);
                setFile(null);
                setError("");
                setMessage("Ebook Added Successfully");
                setAlertType("success");
                setOpenSnackbar(true);
                setUploadProgress(0);
                setExpectedTime("");
            } catch (error) {
                showErrorMessage(error);
            } finally {
                setLoading(false);
            }
        };

        return (
            <Box sx={{ marginTop: "20px" }}>
                <Typography sx={{ marginBottom: "10px" }}>
                    Upload Ebook (Maximum size: 32MB)
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
                    type="number"
                    label="Expected Time (seconds)"
                    value={expectedTime}
                    onChange={(e) => {
                        const value = e.target.value;
                        setExpectedTime(
                            value === ""
                                ? ""
                                : Math.max(
                                    0,
                                    Number.parseInt(value, 10)
                                ).toString()
                        );
                    }}
                    inputProps={{ min: 0 }}
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
                    sx={{ marginTop: "10px", marginBottom: "20px" }}
                    onClick={handleAddBook}
                    disabled={loading || !file}
                >
                    {loading ? <CircularProgress size={24} /> : "Add Book"}
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

    const addEbookDocumentId = () => {
        if (!chapterId) {
            // console.error("Error: Chapter ID is not available.");
            return;
        }

        const handleAddBookByDocumentId = async () => {
            if (!documentId.trim()) {
                setError("Please enter a document ID");
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
                    EbookExpectedtime: expectedTime
                        ? Number.parseInt(expectedTime, 10)
                        : 0,
                };

                console.log("Data to be sent:", data);

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/chapters/addEbookById`,
                    data,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                console.log("Response from server:", response.data);
                setDisplayEbook(true);
                setDocumentId("");
                setError("");
                setMessage("Ebook Added Successfully");
                setAlertType("success");
                setOpenSnackbar(true);
                setExpectedTime("");
            } catch (error) {
                showErrorMessage(error);
                console.error("Error adding ebook by document ID , try to uploaded file:", error);
                setAlertType("error");
                setOpenSnackbar(true);
                setMessage("Error adding ebook by document ID , try to uploaded file");
            } finally {
                setLoading(false);
            }
        };

        return (
            <Box sx={{ marginTop: "20px" }}>
                <Typography sx={{ marginBottom: "10px" }}>
                    Upload Document Id
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    label="Document Id"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    disabled={loading}
                />
                <TextField
                    fullWidth
                    variant="outlined"
                    type="number"
                    label="Expected Time (seconds)"
                    value={expectedTime}
                    onChange={(e) => {
                        const value = e.target.value;
                        setExpectedTime(
                            value === ""
                                ? ""
                                : Math.max(
                                    0,
                                    Number.parseInt(value, 10)
                                ).toString()
                        );
                    }}
                    inputProps={{ min: 0 }}
                    disabled={loading}
                    sx={{ mt: 2, mb: 2 }}
                />
                <Button
                    variant="contained"
                    sx={{ marginTop: "10px", marginBottom: "20px" }}
                    onClick={handleAddBookByDocumentId}
                    disabled={loading || !documentId.trim()}
                >
                    {loading ? <CircularProgress size={24} /> : "Add Book"}
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
        if (value === "ebook") {
            return addEbookByFile();
        }

        if (value === "documentId") {
            return addEbookDocumentId();
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
            {isAiraIndexingFix && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    This chapter already has an ebook for viewing, but AIRA indexing is missing. Upload the same ebook PDF once again here so question generation can read it.
                </Alert>
            )}
            {isAiraIndexingFix && (
                <Box
                    sx={{
                        mb: 2,
                        p: 2,
                        border: "1px solid #D8E7DC",
                        borderRadius: 2,
                        bgcolor: "#F8FAFC",
                    }}
                >
                    <Typography variant="overline" sx={{ color: "#15803D", fontWeight: 900 }}>
                        AIRA indexing fix
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {chapterName || "Selected chapter"}
                    </Typography>
                    <Typography color="text.secondary">
                        {courseName || "Course not tagged"} {chapterId ? `| Chapter ID: ${chapterId}` : ""}
                    </Typography>
                </Box>
            )}
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
                <Tab value="ebook" label="Add Ebook file" />
                <Tab value="documentId" label="Add document Id" />
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

export default AddEbook;
