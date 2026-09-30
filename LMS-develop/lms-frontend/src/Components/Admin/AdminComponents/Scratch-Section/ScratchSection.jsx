import AddIcon from "@mui/icons-material/Add";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";
import SelectBlock from "../SelectBlock/SelectBlock.jsx";
import selectBlockIcon from "./icon--select-blocks.svg";
import "./ScratchSection.css";

const ScratchSection = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [selectedBlock, setSelectedBlock] = useState({
        SelectBlock: [], // Initialize with the correct structure expected by the backend
    });
    const [file, setFile] = useState(null);
    const [SB3file, setSB3file] = useState(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [isPopUpOpen, setIsPopUpOpen] = useState(false); // State to manage pop-up visibility
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        scratchTitle: "",
        scratchDescription: "",
        scratchInstruction: "",
    });
    const { scratchTitle, scratchDescription, scratchInstruction } = formData;

    const handleOnChange = (e) => {
        setFormData((prevData) => ({
            ...prevData,
            [e.target.name]: e.target.value,
        }));
    };

    const handleOpenPopUp = () => {
        setIsPopUpOpen(true); // Open the pop-up
    };

    const handleClosePopUp = () => {
        setIsPopUpOpen(false); // Close the pop-up
    };

    const token = localStorage.getItem("token");

    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            {
                name: "Create Scratch Activity",
                path: "admin-dashboard/create-scratch",
            },
        ]);
    }, [setBreadcrumbTrail]);

    // Function to handle updates from the SelectBlock component
    const handleSelectedBlock = (updatedPreferences) => {
        setSelectedBlock({
            SelectBlock: updatedPreferences,
        });
        
    };

    const handleCourseSave = async () => {
        // Validation checks for required fields
        if (
            !scratchTitle ||
            !scratchDescription ||
            !scratchInstruction ||
            !SB3file
        ) {
            setAlertType("warning");
            setMessage(
                "Please fill all required fields and upload a Scratch .sb3 file."
            );
            setOpenSnackbar(true);
            return;
        }

        // Check if any blocks are selected
        if (
            !selectedBlock.SelectBlock ||
            selectedBlock.SelectBlock.length === 0
        ) {
            setAlertType("warning");
            setMessage("Please select at least one block category.");
            setOpenSnackbar(true);
            return;
        }

        const formDataToSend = new FormData();
        // Append text fields
        formDataToSend.append("ScratchTitle", scratchTitle);
        formDataToSend.append("ScratchDescription", scratchDescription);
        formDataToSend.append("ScratchInstruction", scratchInstruction);

        // Append files - SB3 file is required
        formDataToSend.append("ScratchFile", SB3file);

        // Image is optional
        if (file) {
            formDataToSend.append("ScratchImage", file);
        }

        // Append SelectBlock data as JSON string - send the entire selectedBlock object
        formDataToSend.append("SelectBlock", JSON.stringify(selectedBlock));


        try {
            setLoading(true);
            // Use the correct API endpoint from the environment variables
            await axios.post(
                `${import.meta.env.VITE_API_URL}/scratch/scratch-cloudinary`,
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessage("Scratch Task Created successfully");
            setAlertType("success");
            setOpenSnackbar(true);
        } catch (error) {
            console.error("Error creating Scratch task:", error);

            let errorMessage = "An error occurred";
            if (error.response) {
                console.error("Error response:", error.response);
                errorMessage = error.response.data?.message || errorMessage;
            }

            setAlertType("error");
            setMessage(errorMessage);
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }

        // Reset form after submission
        setFormData({
            scratchTitle: "",
            scratchDescription: "",
            scratchInstruction: "",
        });
        setSB3file(null);
        setFile(null);
        setSelectedBlock({ SelectBlock: [] });
    };

    return (
        <Container maxWidth="md">
            {loading ? (
                <div className="loader">
                    <CircularProgress />
                    <p> Creating Scratch Activity...</p>
                </div>
            ) : (
                <Card variant="outlined">
                    <CardContent>
                        <Typography
                            variant="h5"
                            component="h2"
                            gutterBottom
                            textAlign="center"
                        >
                            Create Scratch Activity
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            label="Scratch Title"
                            name="scratchTitle"
                            value={scratchTitle}
                            onChange={handleOnChange}
                            required
                        />
                        <TextField
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            label="Scratch Activity Description"
                            name="scratchDescription"
                            value={scratchDescription}
                            onChange={handleOnChange}
                            multiline
                            rows={4}
                            required
                        />
                        <TextField
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            label="Scratch Activity Instruction"
                            name="scratchInstruction"
                            value={scratchInstruction}
                            onChange={handleOnChange}
                            multiline
                            rows={4}
                            required
                            helperText="HTML content is allowed for formatting"
                        />

                        <Typography variant="subtitle1" gutterBottom>
                            Upload SB3 files (Required)
                        </Typography>
                        <TextField
                            fullWidth
                            variant="outlined"
                            type="file"
                            name="sb3File"
                            inputProps={{
                                accept: ".sb3",
                            }}
                            onChange={(e) => setSB3file(e.target.files[0])}
                            required
                        />
                        <br />
                        <br />
                        <Typography variant="subtitle1" gutterBottom>
                            Scratch Activity Image (Optional)
                        </Typography>

                        <TextField
                            fullWidth
                            variant="outlined"
                            type="file"
                            name="imageFile"
                            inputProps={{
                                accept: "image/*",
                            }}
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <br />
                        <br />

                        {/* Selected block section */}
                        <Typography variant="subtitle1" gutterBottom>
                            Select Blocks for this Activity (Required)
                        </Typography>

                        <div>
                            <div
                                className="menu-bar-item hoverable file-group"
                                onClick={handleOpenPopUp}
                            >
                                <img
                                    className="help-icon"
                                    src={selectBlockIcon}
                                    alt="Select Blocks"
                                />
                                <span className="tutorials-label">
                                    Click to Select Blocks
                                </span>
                            </div>
                            {isPopUpOpen && (
                                <SelectBlock
                                    onClose={handleClosePopUp}
                                    onUpdateBlocks={handleSelectedBlock}
                                />
                            )}
                        </div>

                        {/* Display selected block categories if any */}
                        {selectedBlock.SelectBlock &&
                            selectedBlock.SelectBlock.length > 0 && (
                                <Box
                                    mt={2}
                                    p={2}
                                    border="1px solid #eee"
                                    borderRadius={1}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                    >
                                        Selected Block Categories:
                                    </Typography>
                                    <ul>
                                        {selectedBlock.SelectBlock.map(
                                            (category, index) => (
                                                <li key={index}>
                                                    {category.blockCategory}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </Box>
                            )}

                        <Button
                            onClick={handleCourseSave}
                            style={{
                                marginTop: "20px",
                                backgroundColor: "green",
                                color: "#fff",
                                padding: "10px 20px",
                            }}
                            variant="contained"
                        >
                            Save Activity
                        </Button>

                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={6000}
                            onClose={() => setOpenSnackbar(false)}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "center",
                            }}
                        >
                            <Alert
                                onClose={() => setOpenSnackbar(false)}
                                severity={alertType}
                                sx={{ width: "100%" }}
                            >
                                {message}
                            </Alert>
                        </Snackbar>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
};

export default ScratchSection;
