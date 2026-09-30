import React, { useContext, useEffect, useState } from "react";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
    Alert,
    Button,
    Box,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";

import { useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../../../BreadcrumbContext";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: "bold",
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    textAlign: "center",
    padding: theme.spacing(1),
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
    },
}));

const CompactTableCell = styled(TableCell)({
    padding: "8px",
    textAlign: "center",
});

const UpdateScratchProjects = () => {
    const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
    const [scratch, setSratch] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [openDialog, setOpenDialog] = useState(false);
    const [scratchDelete, setScratchToDelete] = useState(null);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetchScratch();
    }, []);
    useEffect(() => {
        setBreadcrumbTrail([
            { name: "Admin Dashboard", path: "/admin-dashboard" },
            { name: "Update Scratch", path: "/admin-dashboard/update-Stratch" },
        ]);
    }, []);

    const fetchScratch = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/scratch/get-scratch`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            // Check if response.data exists and has the expected structure
            if (response.data && Array.isArray(response.data.data)) {
                setProjects(response.data.data);
            } else {
                console.error(
                    "Unexpected API response structure:",
                    response.data
                );
                setProjects([]);
            }

           
            setSratch(response.data.data);
        } catch (error) {
            console.error("Error fetching Scratch:", error);
            setErrorMessage("Error fetching Scratch");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (scratchId) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${
                    import.meta.env.VITE_API_URL
                }/scratch/get-scratch-by-id/${scratchId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            navigate("/admin-dashboard/edit-scratch", {
                state: { scratchId: scratchId, scratchData: response.data },
            });
        } catch (error) {
            console.error("Error fetching course details:", error);
            setErrorMessage("Error fetching course details");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrompt = (scratchId) => {
        setScratchToDelete(scratchId);
        setOpenDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (scratchDelete) {
            setLoading(true);
            try {
                await axios.delete(
                    `${import.meta.env.VITE_API_URL}/scratch/delete-scratch/${
                        scratchDelete._id
                    }`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setSuccessMessage(
                    `Course "${scratchDelete.ScratchTitle}" deleted successfully`
                );
                fetchScratch(); // Refresh the course list
            } catch (error) {
                console.error("Error deleting Scratch:", error);
                setErrorMessage(
                    `Error deleting Scratch: ${
                        error.response?.data?.message || error.message
                    }`
                );
            } finally {
                setLoading(false);
            }
        }
        setOpenDialog(false);
        setScratchToDelete(null);
    };

    const handleDeleteCancel = () => {
        setOpenDialog(false);
        setScratchToDelete(null);
    };

    return (
        <Container maxWidth="lg" sx={{ my: 4 }}>
            <Paper
                elevation={3}
                sx={{ p: 4, bgcolor: "#f5f5f5", borderRadius: 2 }}
            >
                <Typography variant="h4" gutterBottom align="center">
                    Update Scratch
                </Typography>
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "20px",
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>
                                        Scratch Name
                                    </StyledTableCell>
                                    <StyledTableCell>Actions</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {scratch.map((stc) => (
                                    <StyledTableRow key={stc._id}>
                                        <CompactTableCell>
                                            {stc.ScratchTitle}
                                        </CompactTableCell>
                                        <CompactTableCell>
                                            <IconButton
                                                onClick={() =>
                                                    handleEdit(stc._id)
                                                }
                                            >
                                                <EditIcon color="primary" />
                                            </IconButton>
                                            <IconButton
                                                onClick={() =>
                                                    handleDeletePrompt(stc)
                                                }
                                            >
                                                <DeleteIcon color="error" />
                                            </IconButton>
                                        </CompactTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog
                open={openDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Confirm Deletion"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the scratch "
                        {scratchDelete?.ScratchTitle}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleDeleteCancel}
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
                open={!!errorMessage || !!successMessage}
                autoHideDuration={6000}
                onClose={() => {
                    setErrorMessage("");
                    setSuccessMessage("");
                }}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={() => {
                        setErrorMessage("");
                        setSuccessMessage("");
                    }}
                    severity={errorMessage ? "error" : "success"}
                    sx={{ width: "100%" }}
                >
                    {errorMessage || successMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default UpdateScratchProjects;
