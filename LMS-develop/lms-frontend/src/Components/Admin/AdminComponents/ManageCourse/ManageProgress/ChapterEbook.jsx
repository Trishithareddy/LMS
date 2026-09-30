import CloudPdfViewer from "@cloudpdf/viewer";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const ChapterEbook = () => {
    const { chapterId } = useParams(); // Get chapter ID from URL
    
    const viewer = useRef(null);
    const [ebookUrl, setEbookUrl] = useState("");
    const [expectedTime, setExpectedTime] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [newExpectedTime, setNewExpectedTime] = useState("");

    useEffect(() => {
        fetchEbookDetails();
    }, [chapterId]);

    // Fetch Ebook details from backend
    const fetchEbookDetails = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/chapters/${chapterId}`
            );
    
            if (response.data ) {
                // Set the Ebook URL and Expected Time
                setEbookUrl(response.data.Ebook);
                setExpectedTime(response.data.EbookExpectedtime);
            }
        } catch (error) {
            console.error("Error fetching ebook details:", error);
        }
    };

    useEffect(() => {
        if (ebookUrl) {
            CloudPdfViewer(
                {
                    documentId: ebookUrl,
                    darkMode: true,
                },
                viewer.current
            );
        }
    }, [ebookUrl]);  // This effect runs only when ebookUrl is updated

    // Handle Save Expected Time
    const handleSaveTime = async () => {
        try {
            const numericExpectedTime = Number(newExpectedTime); // Ensure it's a number
    
            if (isNaN(numericExpectedTime) || numericExpectedTime < 0) {
                console.error('Invalid expected time');
                return; // You could also display an error message to the user here
            }
    
            const requestBody = {
                chapterId,
                EbookExpectedtime: numericExpectedTime,
            };
         
    
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/admin/updateChapterEbookTime`,
                requestBody,
                { headers: { "Content-Type": "application/json" } }
            );
    
            if (response.data.success) {
                setExpectedTime(numericExpectedTime);
                setEditMode(false);
            }
        } catch (error) {
            console.error("Error updating expected time:", error);
        }
    };
    

    return (
        <Box sx={{ mt: 4 }}>
            {/* E-Book Viewer */}
            <Box
                sx={{
                    width: "80%",
                    margin: "0 auto",
                    padding: "20px",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    height: "80vh",
                    "@media (max-width: 600px)": {
                        width: "100%",
                    },
                }}
            >
                <Box sx={{ height: "100%" }} ref={viewer}></Box>
            </Box>

            {/* Expected Time Edit Section */}
            <Paper
                elevation={3}
                sx={{
                    width: "60%",
                    margin: "20px auto",
                    padding: "15px",
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: "#f5f5f5",
                }}
            >
                <Typography variant="h6" gutterBottom>
                    Ebook Expected Time (minutes)
                </Typography>

                {!editMode ? (
                    <Typography variant="h5">
                        {expectedTime} secs
                    </Typography>
                ) : (
                    <TextField
                        type="number"
                        value={newExpectedTime}
                        onChange={(e) => setNewExpectedTime(e.target.value)}
                        size="small"
                        sx={{ width: "80px", marginRight: "10px" }}
                    />
                )}

                {!editMode ? (
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ ml: 2 }}
                        onClick={() => {
                            setNewExpectedTime(expectedTime);
                            setEditMode(true);
                        }}
                    >
                        Edit Time
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        color="success"
                        sx={{ ml: 2 }}
                        onClick={handleSaveTime}
                    >
                        Save
                    </Button>
                )}
            </Paper>
        </Box>
    );
};

export default ChapterEbook;
