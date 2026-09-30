import {
    Alert,
    Box,
    Button,
    Snackbar,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

function AddWorksheet() {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [file, setFile] = useState(null);
    const [chapterId, setChapterId] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [documentId, setDocumentId] = useState("");
    const [displayWorksheet, setDisplayWorksheet] = useState(false);
    const [error, setError] = useState("");
    const [value, setValue] = useState("worksheet");
    const location = useLocation();
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");

    useEffect(() => {
        setBreadcrumbTrail([
            { name: 'Admin Dashboard', path: '/admin-dashboard' },
            { name: 'Update Courses', path: '/admin-dashboard/update-courses' },
            { name: 'Edit Course', path: '/admin-dashboard/edit-course', state:{courseData:location.state?.courseData} },
            { name: 'Create Chapter', path: '/admin-dashboard/create-chapter', state: { chapterId: location.state?.chapterId, courseData:location.state?.courseData,courseId:location.state?.courseId,
                courseName:location.state?.courseName, from1:location.state?.from} },
            { name: 'Add Worksheet', path: '/admin-dashboard/add-worksheet' },
        ]);
    
}, [location]);

    useEffect(() => {
        if (location.state) {
            
            setChapterId(location.state.chapterId);
        }
    }, [location]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const addWorksheetByFile = () => {
        if (!chapterId) {
            console.error("Error: Chapter ID is not available.");
            return;
        }

        const handleAddWorksheet = async () => {
            const formData = new FormData();
            formData.append("worksheet", file);
            formData.append("chapterId", chapterId);

            try {
                const token = localStorage.getItem("token");
                const response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/chapters/addWorksheet`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                
                setPdfUrl(response.data.chapter.worksheet);
                setFile(null);
                setError("");
                setMessage("Worksheet Added");
                setAlertType("success");
                setOpenSnackbar(true);
            } catch (error) {
                setMessage("Error adding Worksheet");
                setAlertType("error");
                setOpenSnackbar(true);
                setError("Failed to upload Worksheet. Please try again.");
            }
        };

        return (
            <Box sx={{ marginTop: "20px" }}>
                <Typography sx={{ marginBottom: "10px" }}>
                    Upload Worksheet
                </Typography>
                <TextField
                    fullWidth
                    variant="outlined"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                />
                <Button
                    variant="contained"
                    sx={{ marginTop: "10px" }}
                    onClick={handleAddWorksheet}
                >
                    Add Worksheet
                </Button>
                {error && (
                    <Typography color="error" mt={2}>
                        {error}
                    </Typography>
                )}
                <Box>{pdfUrl && <iframe src={pdfUrl} width="100%" height="500px" />}</Box>
            </Box>
        );
    };

    const addWorksheetDocumentId = () => {
        if (!chapterId) {
            console.error("Error: Chapter ID is not available.");
            return;
        }

        const handleAddWorksheetByDocumentId = async () => {
            const data = {
                chapterId: chapterId,
                cloudPdfDocumentId: documentId,
            };

            try {
                const token = localStorage.getItem("token");
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/chapters/addWorksheetById`,
                    data,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                
                setDisplayWorksheet(true);
                setDocumentId("");
                setError("");
                setMessage("Worksheet Added");
                setAlertType("success");
                setOpenSnackbar(true);
            } catch (error) {
                setMessage("Error adding Worksheet");
                setAlertType("error");
                setOpenSnackbar(true);
                setError("Failed to upload Worksheet. Please try again.");
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
                    onChange={(e) => setDocumentId(e.target.value)}
                />
                <Button
                    variant="contained"
                    sx={{ marginTop: "10px" }}
                    onClick={handleAddWorksheetByDocumentId}
                >
                    Add Worksheet
                </Button>
                {error && (
                    <Typography color="error" mt={2}>
                        {error}
                    </Typography>
                )}
                <Box>{displayWorksheet && <iframe src={documentId} width="100%" height="500px" />}</Box>
            </Box>
        );
    };

    const renderTabs = () => {
        if (value === "worksheet") {
            return addWorksheetByFile();
        }

        if (value === "documentId") {
            return addWorksheetDocumentId();
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
                <Tab value="worksheet" label="Add Worksheet file" />
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

export default AddWorksheet;