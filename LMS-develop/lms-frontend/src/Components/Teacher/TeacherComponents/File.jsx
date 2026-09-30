import React, { useState, useEffect } from "react";
import {
    TableCell,
    TableRow,
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
    IconButton,
    Switch
} from "@mui/material";
import { jwtDecode } from "jwt-decode";

import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import axios from "axios";

function File({ details, chapterId, openDocumentId, allFolders }) {
    const [open, setOpen] = useState(false);
    const handleClose = () => setOpen(false);
    const [fileName, setFileName] = useState(details.name);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [role, setRole] = useState(null);
    const [isActive, setIsActive] = useState(details.isActive);
  


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
    const handleChangeFileName = (event) => {
        setFileName(event.target.value);
    };

    const fileRename = () => {
        setOpen(true);
    };

    const handleFileRename = async () => {
        const data = { name: fileName };

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/chapters/rename/file/${details._id
                }`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            setMessage("File Renamed Successfully");
            setAlertType("success");
            setOpenSnackbar(true);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            setMessage("Error Renaming file");
            setAlertType("error");
            setOpenSnackbar(true);
            console.error("Error renaming file:",error);
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

    const handleOpenDocumentId = () => {
        openDocumentId(details.fileUrl);
    };

    const handleToggleActive = async () => {

        try {
            const token = localStorage.getItem("token");
            
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/chapters/toggle/file/${details._id}`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setIsActive((prev) => !prev);

            setMessage("File status updated successfully");
            setAlertType("success");
            setOpenSnackbar(true);
        } catch (error) {
            setMessage("Error updating file status");
            setAlertType("error");
            setOpenSnackbar(true);
            console.error("Error updating file status:", error);
        }
    };

    return (
        <>
            <TableRow>
                <TableCell>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <IconButton size="small" onClick={handleOpenDocumentId}>
                            <InsertDriveFileIcon sx={{ color: "gray" }} />
                        </IconButton>
                        <div>{details.name}</div>
                    </div>
                </TableCell>

                <TableCell>{convertUTCToIST(details.updatedAt)}</TableCell>
                <TableCell>
                    {role === "Teacher" && (
                        <Switch
                            checked={isActive}
                            onChange={handleToggleActive}
                            color="primary"
                        />
                    )}
                </TableCell>
            </TableRow>
      
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

export default File;
