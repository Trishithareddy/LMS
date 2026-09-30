import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
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
import { Edit, Add, Search, Delete,UploadFile } from "@mui/icons-material";
import axios from "axios";

const StudentList = ({
    students,
    batches,
    onEditStudent,
    onHandleBlockStudent,
    onAddStudent,
    onBulkAddStudent,
    fetchData,
}) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [batchSearchTerm, setBatchSearchTerm] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);
    const [selectedstudentId, setSelectedStudentId] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);

    const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setPage(0);
    setSearchTerm("");
};

const handleBackToBatches = () => {
    setSelectedBatch(null);
    setPage(0);
    setSearchTerm("");
};

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    const batchStudents = selectedBatch
    ? (selectedBatch.students || [])
    : [];

const filteredStudents = batchStudents.filter(
    (student) =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.section?.toLowerCase().includes(searchTerm.toLowerCase())
);

const filteredBatches = (batches || []).filter((batch) => {
    const search = batchSearchTerm.toLowerCase().trim();

    if (!search) return true;

    // Search by batch name
    if (batch.batchName?.toLowerCase().includes(search)) {
        return true;
    }

    // Search inside students of each batch
    return (batch.students || []).some((student) =>
        student.name?.toLowerCase().includes(search) ||
        student.username?.toLowerCase().includes(search) ||
        student.class?.toLowerCase().includes(search) ||
        student.section?.toLowerCase().includes(search)
    );
});

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const onDeleteStudent = (studentId) => {
        setDeleteModal(true);
        setSelectedStudentId(studentId);
    };

    const onClose = () => {
        setDeleteModal(false);
    };
    const handleDelete = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/school-admin/delete-student/${selectedstudentId._id
                }`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage("Student Removed successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                setDeleteModal(false);
                fetchData();
            }
        } catch (error) {
            console.error("Error unable to Removed Student:", error);
            setSnackbarMessage("Unable to Removed Student");
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

    {!selectedBatch ? (
        <>
            {/* =========================
                BATCH LIST VIEW
            ========================== */}

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
                    Students Management
                </Typography>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadFile />}
                        onClick={onBulkAddStudent}
                        sx={{
                            borderColor: "#2E7D32",
                            color: "#2E7D32",
                            "&:hover": {
                                borderColor: "#1B5E20",
                                backgroundColor: "#E8F5E8",
                            },
                        }}
                    >
                        Bulk Upload
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={onAddStudent}
                        sx={{
                            backgroundColor: "#2E7D32",
                            "&:hover": {
                                backgroundColor: "#1B5E20",
                            },
                        }}
                    >
                        Add Student
                    </Button>
                </Box>
            </Box>

           <Typography
    variant="h6"
    sx={{
        mb: 2,
        fontWeight: 600,
    }}
>
    Select Batch
</Typography>

<Box sx={{ mb: 3 }}>
    <TextField
        fullWidth
        placeholder="Search student by name, username, grade or section..."
        value={batchSearchTerm}
        onChange={(e) => setBatchSearchTerm(e.target.value)}
        InputProps={{
            startAdornment: (
                <InputAdornment position="start">
                    <Search />
                </InputAdornment>
            ),
        }}
        sx={{
            maxWidth: 500,
        }}
    />
</Box>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(4, 1fr)",
                    },
                    gap: 3,
                }}
            >
                {filteredBatches.map((batch) => (
                    <Paper
                        key={batch._id}
                        elevation={2}
                        onClick={() => handleBatchSelect(batch)}
                        sx={{
                            p: 3,
                            cursor: "pointer",
                            borderRadius: 3,
                            border: "1px solid #E0E0E0",
                            transition: "0.2s",

                            "&:hover": {
                                transform: "translateY(-3px)",
                                boxShadow: 5,
                                borderColor: "#2E7D32",
                            },
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: "bold",
                                color: "#2E7D32",
                                mb: 1,
                            }}
                        >
                            {batch.batchName}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {batch.students?.length || 0} Students
                        </Typography>
                    </Paper>
                ))}
            </Box>

            {filteredBatches.length === 0 && (
    <Paper
        sx={{
            p: 5,
            textAlign: "center",
            mt: 3,
        }}
    >
        <Typography color="text.secondary">
            No batches or students found.
        </Typography>
    </Paper>
)}
        </>
    ) : (
        <>
            {/* =========================
                SELECTED BATCH STUDENTS
            ========================== */}

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                }}
            >
                <Box>
                    <Button
                        onClick={handleBackToBatches}
                        sx={{
                            color: "#2E7D32",
                            mb: 1,
                        }}
                    >
                        ← Back to Batches
                    </Button>

                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{ fontWeight: "bold" }}
                    >
                        {selectedBatch.batchName}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        {selectedBatch.students?.length || 0} Students
                    </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadFile />}
                        onClick={onBulkAddStudent}
                        sx={{
                            borderColor: "#2E7D32",
                            color: "#2E7D32",
                        }}
                    >
                        Bulk Upload
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={onAddStudent}
                        sx={{
                            backgroundColor: "#2E7D32",
                            "&:hover": {
                                backgroundColor: "#1B5E20",
                            },
                        }}
                    >
                        Add Student
                    </Button>
                </Box>
            </Box>

            {/* Search */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Search students by name, grade or username..."
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
                                        {/* <TableCell>
                                            <strong>FatherName</strong>
                                        </TableCell> */}
                                        <TableCell>
                                            <strong>Grade</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Section</strong>
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
                                    {filteredStudents
                                        .slice(
                                            page * rowsPerPage,
                                            page * rowsPerPage + rowsPerPage
                                        )
                                        .map((student) => (
                                            <TableRow key={student._id} hover>
                                                <TableCell>
                                                    {student.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={student.class}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor:
                                                                "#E8F5E8",
                                                            color: "#2E7D32",
                                                            fontWeight: "bold",
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {student.section}
                                                </TableCell>
                                                <TableCell>
                                                    {student.username}
                                                </TableCell>


                                                <TableCell>
                                                    <Button
                                                        onClick={() =>
                                                            onHandleBlockStudent(
                                                                student._id
                                                            )
                                                        }
                                                    >
                                                        <Chip
                                                            label={
                                                                student.isActive
                                                                    ? "active"
                                                                    : "inactive"
                                                            }
                                                            size="small"
                                                            sx={{
                                                                backgroundColor:
                                                                    student.isActive
                                                                        ? "#E8F5E8"
                                                                        : "#FFEBEE",
                                                                color: student.isActive
                                                                    ? "#2E7D32"
                                                                    : "#D32F2F",
                                                            }}
                                                        />
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        onClick={() =>
                                                            onEditStudent(
                                                                student
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
                                                                student
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
                            count={filteredStudents.length}
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
                                    Are you sure you want to Remove this student
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
                </>
            )}
                </Box>
            )}
        </>
    );
};

export default StudentList;
