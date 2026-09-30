import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    IconButton,
    Chip,
    Button,
    TextField,
    InputAdornment,
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Edit, Add, Search, Delete } from "@mui/icons-material";
import axios from "axios";
const TeacherList = ({
    teachers,
    onEditTeacher,
    onHandleBlockTeacher,
    onAddTeacher,
    fetchData,
}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedteacherId, setSelectedTeacherId] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [isLoading, setIsLoading] = useState(false);

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const filteredTeachers = teachers.filter(
        (teacher) =>
            teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    const onDeleteStudent = (teacherId) => {
        setDeleteModal(true);
        setSelectedTeacherId(teacherId);
    };

    const onClose = () => {
        setDeleteModal(false);
    };
    const handleDelete = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL
                }/school-admin/delete-teacher/${selectedteacherId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage("Teacher Removed successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                setDeleteModal(false);
                fetchData();
            }
        } catch (error) {
            console.error("Error unable to Removed Teacher:", error);
            setSnackbarMessage("Unable to Removed Teacher");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <>
            {isLoading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "90vh",
                        color: "#2E7D32",
                        width: "90%",
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ flexGrow: 1, p: 3 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 3,
                        }}
                    >
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{ fontWeight: "bold" }}
                        >
                            Teachers Management
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={onAddTeacher}
                            sx={{
                                backgroundColor: "#2E7D32",
                                "&:hover": {
                                    backgroundColor: "#1B5E20",
                                },
                            }}
                        >
                            Add Teacher
                        </Button>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            placeholder="Search teachers by name, email, or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ maxWidth: 400 }}
                        />
                    </Box>

                    <Paper elevation={2}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow
                                        sx={{ backgroundColor: "#F5F5F5" }}
                                    >
                                        <TableCell>
                                            <strong>Name</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Subject</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Username</strong>
                                        </TableCell>

                                        <TableCell>
                                            <strong>Status</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Actions</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Remove</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTeachers
                                        .slice(
                                            page * rowsPerPage,
                                            page * rowsPerPage + rowsPerPage
                                        )
                                        .map((teacher) => (
                                            <TableRow key={teacher._id} hover>
                                                <TableCell>
                                                    {teacher.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label="Computer Sceince"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor:
                                                                "#E3F2FD",
                                                            color: "#1976D2",
                                                            fontWeight: "bold",
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {teacher.username}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        onClick={() =>
                                                            onHandleBlockTeacher(
                                                                teacher._id
                                                            )
                                                        }
                                                    >
                                                        <Chip
                                                            label={
                                                                teacher.isActive
                                                                    ? "Active"
                                                                    : "Inactive"
                                                            }
                                                            size="small"
                                                            sx={{
                                                                backgroundColor:
                                                                    teacher.isActive
                                                                        ? "#E8F5E8"
                                                                        : "#FFEBEE",
                                                                color: teacher.isActive
                                                                    ? "#2E7D32"
                                                                    : "#D32F2F",
                                                            }}
                                                        />
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        onClick={() =>
                                                            onEditTeacher(
                                                                teacher
                                                            )
                                                        }
                                                        sx={{
                                                            color: "#2E7D32",
                                                        }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        onClick={() =>
                                                            onDeleteStudent(
                                                                teacher._id
                                                            )
                                                        }
                                                        sx={{
                                                            color: "#D32F2F",
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[10, 25]}
                            component="div"
                            count={filteredTeachers.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>

                    {deleteModal && (
                        <Dialog
                            open={deleteModal}
                            onClose={onClose}
                            maxWidth="sm"
                            fullWidth
                        >
                            <DialogTitle>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        padding: 2,
                                    }}
                                >
                                    Are you sure you want to Remove this Teacher
                                    ?
                                </Typography>
                            </DialogTitle>
                            <DialogContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: 2,
                                        padding: 1,
                                    }}
                                >
                                    <Button
                                        onClick={onClose}
                                        variant="contained"
                                        sx={{ mr: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleDelete}
                                        variant="contained"
                                        color="error"
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={3000}
                        onClose={handleSnackbarClose}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "center",
                        }}
                    >
                        <Alert
                            onClose={handleSnackbarClose}
                            severity={snackbarSeverity}
                            sx={{ width: "100%" }}
                            icon={
                                snackbarSeverity === "success" ? (
                                    <CheckCircleOutlineIcon fontSize="inherit" />
                                ) : undefined
                            }
                        >
                            {snackbarMessage}
                        </Alert>
                    </Snackbar>
                </Box>
            )}
        </>
    );
};

export default TeacherList;
