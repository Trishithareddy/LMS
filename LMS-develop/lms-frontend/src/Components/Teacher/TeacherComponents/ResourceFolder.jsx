import React, { useState, useEffect } from "react";
import {
    TableCell,
    TableRow,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Modal,
    Typography,
    TextField,
    Snackbar,
    Alert,
} from "@mui/material";
import { Folder } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
function ResourceFolder({ details, changeParentId, chapterId ,allFolders}) {
    const [open, setOpen] = useState(false);
    const handleClose = () => setOpen(false);
    const [folderName, setFolderName] = useState(details.name);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setRole(decoded.role);
            } catch (error) {
                console.error("Token decoding failed", error);
            }
        }
    }, []);

     

    if (role) {
        console.log("Role:", role);
    }

    const handleChangeFolderName = (event) => {
        setFolderName(event.target.value);
    };

    const folderRename = () => {
        setOpen(true);
    };

    const handleFolderRename = async () => {
        const data = { name: folderName };
        const token = localStorage.getItem("token");
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/chapters/rename/folder/${details._id
                }`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessage("Folder Renamed Successfully");
            setAlertType("success");
            setOpenSnackbar(true);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            setMessage("Error Renaming folder");
            setAlertType("error");
            setOpenSnackbar(true);
            console.error("Error renaming folder:",error);
        }
    };

    const handleSomeEvent = () => {
        changeParentId(details._id);
        if (role === "Teacher") {
            navigate(`/teacher-dashboard/resources/folder/${details._id}`, {
                state: { chapterId },
            });
        } else if (role === "Student") {
            navigate(`/student-dashboard/resources/folder/${details._id}`, {
                state: { chapterId },
            });
        }
    };

    function convertUTCToIST(utcDateString) {
        const utcDate = new Date(utcDateString);

        const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false, // Use 24-hour format
            timeZone: "Asia/Kolkata", // Use IST timezone
        };

        return utcDate.toLocaleString("en-IN", options);
    }

    return (
        <>
            <TableRow onClick={handleSomeEvent}>
                <TableCell>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <IconButton size="small">
                            <Folder sx={{ color: details.color }} />
                        </IconButton>
                        <div>{details.name === "Worksheets" ? " Additional Worksheets" : details.name}</div>
                    </div>
                </TableCell>

                <TableCell>{convertUTCToIST(details.updatedAt)}</TableCell>
                <TableCell>---</TableCell>

            </TableRow>
            <Modal
                open={open === true}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>
                        <Typography variant="h6">Rename</Typography>
                    </DialogTitle>

                    <DialogContent>
                        <TextField
                            label="Enter folder name"
                            variant="outlined"
                            fullWidth
                            value={folderName}
                            onChange={handleChangeFolderName}
                            sx={{ marginTop: "15px" }}
                        />
                    </DialogContent>

                    <DialogActions>
                        <Button
                            onClick={handleClose}
                            color="primary"
                            variant="outlined"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleFolderRename}
                            color="primary"
                            variant="contained"
                        >
                            Ok
                        </Button>
                    </DialogActions>
                </Dialog>
            </Modal>
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
}

export default ResourceFolder;
