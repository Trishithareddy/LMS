import React, { useState } from "react";
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
    DialogContentText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import { Folder } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ResourceFolder({ details, changeParentId, chapterId }) {
    const [open, setOpen] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const handleClose = () => setOpen(false);
    const handleCloseOpenDialog = () => setOpenDialog(false);
    const [folderName, setFolderName] = useState(details.name);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const handleDeleteConfirm = async () => {
        try {
            
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/chapters/delete/folder/${
                    details._id
                }`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setMessage("Folder deleted Successfully");
            setAlertType("success");
            setOpenSnackbar(true);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (error) {
            console.error("Error deleting folder:", error);

            setMessage("Folder deletion failed");
            setAlertType("error");
            setOpenSnackbar(true);
        }

        setOpenDialog(false);
    };

    const handleChangeFolderName = (event) => {
        setFolderName(event.target.value);
    };

    const handleDeleteIconClick = () => {
        setOpenDialog(true);
    };

    const folderRename = () => {
        setOpen(true);
    };

    const handleFolderRename = async () => {
        const data = { name: folderName };

        try {
            const token = localStorage.getItem("token");
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/chapters/rename/folder/${
                    details._id
                }`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
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
        navigate(`/admin-dashboard/add-worksheet-new/folder/${details._id}`, {
            state: { chapterId },
        });
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
            <TableRow onDoubleClick={handleSomeEvent}>
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
                        <div>{details.name}</div>
                    </div>
                </TableCell>

                <TableCell>{convertUTCToIST(details.updatedAt)}</TableCell>
                <TableCell>---</TableCell>
                <TableCell align="right">
                    <IconButton onClick={() => folderRename()}>
                        <EditIcon color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteIconClick()}>
                        <DeleteIcon color="error" />
                    </IconButton>
                </TableCell>
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

            <Dialog
                open={openDialog}
                onClose={handleCloseOpenDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the Folder "
                        {details.name}?"
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseOpenDialog}
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
