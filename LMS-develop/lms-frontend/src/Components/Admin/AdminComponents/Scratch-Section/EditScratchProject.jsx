import AddIcon from "@mui/icons-material/Add";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    TextField,
    Typography,
    Snackbar,
} from "@mui/material";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";
import SelectBlock from "../SelectBlock/SelectBlock.jsx";
import selectBlockIcon from "./icon--select-blocks.svg";
import "./ScratchSection.css";

const EditScratchProject = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [selectedBlock, setSelectedBlock] = useState({ SelectBlock: [] });
    const [file, setFile] = useState(null);
    const [SB3file, setSB3file] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [isPopUpOpen, setIsPopUpOpen] = useState(false);
    const [formData, setFormData] = useState({
        scratchTitle: "",
        scratchDescription: "",
        scratchInstruction: "",
    });

    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const location = useLocation();
    const scratchId = location.state?.scratchId;

    const { scratchTitle, scratchDescription, scratchInstruction } = formData;

    useEffect(() => {
        fetchScratchById(scratchId);
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            {
                name: "Update Scratch Activity",
                path: "admin-dashboard/update-scratch",
            },
        ]);
    }, [scratchId]);

    const fetchScratchById = async (id) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/scratch/get-scratch-by-id/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
          
            const data = response.data.data;
            setFormData({
                scratchTitle: data.ScratchTitle || "",
                scratchDescription: data.ScratchDescription || "",
                scratchInstruction: data.ScratchInstruction || "",
            });

            setSelectedBlock({ SelectBlock: data.SelectBlock || [] });
        } catch (error) {
            console.error("Error fetching Scratch details:", error);
        } finally {
            setLoading(false);
        }
    };
    const handleOnChange = (e) => {
        setFormData((prevData) => ({
            ...prevData,
            [e.target.name]: e.target.value,
        }));
    };

    const handleOpenPopUp = () => setIsPopUpOpen(true);
    const handleClosePopUp = () => setIsPopUpOpen(false);

    const handleSelectedBlock = (updatedPreferences) => {
        setSelectedBlock({ SelectBlock: updatedPreferences });
    };

    const handleCourseSave = async () => {
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
        formDataToSend.append("ScratchTitle", scratchTitle);
        formDataToSend.append("ScratchDescription", scratchDescription);
        formDataToSend.append("ScratchInstruction", scratchInstruction);
        formDataToSend.append("ScratchFile", SB3file);
        if (file) formDataToSend.append("ScratchImage", file);
        formDataToSend.append("SelectBlock", JSON.stringify(selectedBlock));

        try {
            setLoading(true);
            await axios.put(
                `${
                    import.meta.env.VITE_API_URL
                }/scratch/update-scratch/${scratchId}`,
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setAlertType("success");
            setMessage("Scratch Task updated successfully");
            setOpenSnackbar(true);
        } catch (error) {
            console.error("Error updating Scratch task:", error);
            const errorMessage =
                error.response?.data?.message || "An error occurred";
            setAlertType("error");
            setMessage(errorMessage);
            setOpenSnackbar(true);
        } finally {
            setLoading(false);
        }

        // Optionally reset form
        // setFormData({ scratchTitle: "", scratchDescription: "", scratchInstruction: "" });
        // setSB3file(null);
        // setFile(null);
        // setSelectedBlock({ SelectBlock: [] });
    };

    return (
        <Container maxWidth="md">
            {loading ? (
                <div className="loader">
                    <CircularProgress />
                    <p>Updating Scratch Activity...</p>
                </div>
            ) : (
                <Card variant="outlined">
                    <CardContent>
                        <Typography
                            variant="h5"
                            textAlign="center"
                            gutterBottom
                        >
                            Edit Scratch Activity
                        </Typography>

                        <TextField
                            fullWidth
                            label="Scratch Title"
                            name="scratchTitle"
                            value={formData.scratchTitle}
                            onChange={handleOnChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Scratch Activity Description"
                            name="scratchDescription"
                            value={formData.scratchDescription}
                            onChange={handleOnChange}
                            margin="normal"
                            multiline
                            rows={4}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Scratch Activity Instruction"
                            name="scratchInstruction"
                            value={formData.scratchInstruction}
                            onChange={handleOnChange}
                            margin="normal"
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
                            type="file"
                            inputProps={{ accept: ".sb3" }}
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
                            type="file"
                            inputProps={{ accept: "image/*" }}
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                        <br />
                        <br />

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

                        {/* {selectedBlock.SelectBlock.length > 0 && (
                            <Box
                                mt={2}
                                p={2}
                                border="1px solid #eee"
                                borderRadius={1}
                            >
                                <Typography variant="subtitle2">
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
                        )} */}

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
                            Update Activity
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

export default EditScratchProject;
