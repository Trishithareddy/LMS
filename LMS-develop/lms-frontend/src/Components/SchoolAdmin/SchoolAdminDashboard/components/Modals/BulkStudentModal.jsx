import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from "@mui/material";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import axios from "axios";
import Papa from "papaparse";

const BulkStudentModal = ({
    open,
    onClose,
    getbatches,
    getSchool,
    fetchData,
}) => {
    const [selectedBatch, setSelectedBatch] = useState("");
    const [students, setStudents] = useState([]);
    const [fileName, setFileName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");

    // ---------------------------------------------------------
    // Snackbar
    // ---------------------------------------------------------

    const showMessage = (message, severity = "success") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setOpenSnackbar(true);
    };

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    // ---------------------------------------------------------
    // Reset
    // ---------------------------------------------------------

    const resetModal = () => {
        setSelectedBatch("");
        setStudents([]);
        setFileName("");

        const fileInput =
            document.getElementById("bulk-student-csv");

        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleClose = () => {
        if (isLoading) return;

        resetModal();
        onClose();
    };

    // ---------------------------------------------------------
    // CSV columns
    // ---------------------------------------------------------

    const requiredColumns = [
        "name",
        "username",
        "password",
        "age",
        "contact",
        "fatherName",
        "address",
        "studentClass",
        "section",
    ];

    // ---------------------------------------------------------
    // CSV upload
    // ---------------------------------------------------------

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            showMessage(
                "Please select a CSV file.",
                "error"
            );

            event.target.value = "";
            return;
        }

        setFileName(file.name);
        setStudents([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,

            transformHeader: (header) =>
                header.trim(),

            complete: (results) => {
                if (results.errors?.length > 0) {
                    console.error(
                        "CSV errors:",
                        results.errors
                    );

                    showMessage(
                        "Unable to read the CSV file.",
                        "error"
                    );

                    return;
                }

                const data = results.data;

                if (!data.length) {
                    showMessage(
                        "CSV file contains no students.",
                        "error"
                    );

                    return;
                }

                // Check columns
                const columns = Object.keys(data[0]);

                const missingColumns =
                    requiredColumns.filter(
                        (column) =>
                            !columns.includes(column)
                    );

                if (missingColumns.length > 0) {
                    showMessage(
                        `Missing columns: ${missingColumns.join(
                            ", "
                        )}`,
                        "error"
                    );

                    setStudents([]);
                    return;
                }

                // Check rows
                const invalidRows = [];

                data.forEach((student, index) => {
                    const rowNumber = index + 2;

                    requiredColumns.forEach(
                        (column) => {
                            if (
                                student[column] ===
                                    undefined ||
                                student[column] ===
                                    null ||
                                String(
                                    student[column]
                                ).trim() === ""
                            ) {
                                invalidRows.push(
                                    `Row ${rowNumber}: ${column} is required`
                                );
                            }
                        }
                    );

                    if (
                        student.age &&
                        isNaN(Number(student.age))
                    ) {
                        invalidRows.push(
                            `Row ${rowNumber}: age must be a number`
                        );
                    }

                    if (
                        student.password &&
                        String(
                            student.password
                        ).length < 6
                    ) {
                        invalidRows.push(
                            `Row ${rowNumber}: password must be at least 6 characters`
                        );
                    }
                });

                if (invalidRows.length > 0) {
                    showMessage(
                        invalidRows
                            .slice(0, 5)
                            .join(" | "),
                        "error"
                    );

                    setStudents([]);
                    return;
                }

                setStudents(data);

                showMessage(
                    `${data.length} student(s) loaded successfully.`
                );
            },

            error: (error) => {
                console.error(
                    "CSV parsing error:",
                    error
                );

                showMessage(
                    "Unable to read CSV file.",
                    "error"
                );

                setStudents([]);
            },
        });
    };

    // ---------------------------------------------------------
    // Submit bulk students
    // ---------------------------------------------------------

    const handleBulkSubmit = async () => {
        if (!selectedBatch) {
            showMessage(
                "Please select a batch.",
                "error"
            );
            return;
        }

        if (!students.length) {
            showMessage(
                "Please upload a CSV file.",
                "error"
            );
            return;
        }

        if (!getSchool?._id) {
            showMessage(
                "School information is not available.",
                "error"
            );
            return;
        }

        const token =
            localStorage.getItem("token");

        // Convert CSV rows into the SAME
        // structure used by StudentModal
        const studentData = students.map(
            (student) => ({
                name: String(
                    student.name
                ).trim(),

                username: String(
                    student.username
                ).trim(),

                password: String(
                    student.password
                ),

                age: Number(
                    student.age
                ),

                contact: String(
                    student.contact
                ).trim(),

                fatherName: String(
                    student.fatherName
                ).trim(),

                address: String(
                    student.address
                ).trim(),

                studentClass: String(
                    student.studentClass
                ).trim(),

                section: String(
                    student.section
                ).trim(),

                // Current school
                schoolId: getSchool._id,

                // Selected batch
                batchId: [selectedBatch],
            })
        );

        try {
            setIsLoading(true);

            console.log(
                "Bulk students:",
                studentData
            );

            const response =
                await axios.post(
                    `${
                        import.meta.env
                            .VITE_API_URL
                    }/admin/student/create`,
                    {
                        students:
                            studentData,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            if (response.data.success) {
                showMessage(
                    response.data.message ||
                        `${studentData.length} student(s) added successfully.`
                );

                fetchData();

                setTimeout(() => {
                    resetModal();
                    onClose();
                }, 1000);
            } else {
                showMessage(
                    response.data.message ||
                        "Unable to add students.",
                    "error"
                );
            }
        } catch (error) {
            console.error(
                "Bulk student error:",
                error
            );

            showMessage(
                error.response?.data?.message ||
                    "Something went wrong while adding students.",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ---------------------------------------------------------
    // Download CSV template
    // ---------------------------------------------------------

    const downloadTemplate = () => {
        const template = [
            {
                name: "Rahul Kumar",
                username: "rahul@gmail.com",
                password: "123456",
                age: 10,
                contact: "9999999999",
                fatherName: "Ramesh Kumar",
                address: "Hyderabad",
                studentClass: "5th",
                section: "A",
            },
        ];

        const csv =
            Papa.unparse(template);

        const blob = new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;",
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            "student-template.csv";

        link.click();

        URL.revokeObjectURL(url);
    };

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: "bold",
                        }}
                    >
                        Bulk Add Students
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mt: 2 }}>

                        {/* Batch */}

                        <FormControl
                            fullWidth
                            required
                            sx={{ mb: 3 }}
                        >
                            <InputLabel>
                                Batch
                            </InputLabel>

                            <Select
                                value={
                                    selectedBatch
                                }
                                label="Batch"
                                onChange={(e) =>
                                    setSelectedBatch(
                                        e.target
                                            .value
                                    )
                                }
                                disabled={
                                    isLoading
                                }
                            >
                                {getbatches?.map(
                                    (batch) => (
                                        <MenuItem
                                            key={
                                                batch._id
                                            }
                                            value={
                                                batch._id
                                            }
                                        >
                                            {
                                                batch.batchName
                                            }
                                        </MenuItem>
                                    )
                                )}
                            </Select>
                        </FormControl>

                        {/* Instructions */}

                        <Alert
                            severity="info"
                            sx={{ mb: 3 }}
                        >
                            Select the batch first.
                            All students in the
                            uploaded CSV will be
                            added to this batch.
                        </Alert>

                        {/* Template */}

                        <Button
                            variant="outlined"
                            onClick={
                                downloadTemplate
                            }
                            disabled={
                                isLoading
                            }
                            sx={{ mb: 3 }}
                        >
                            Download CSV Template
                        </Button>

                        {/* Upload */}

                        <Box sx={{ mb: 3 }}>
                            <input
                                id="bulk-student-csv"
                                type="file"
                                accept=".csv"
                                hidden
                                onChange={
                                    handleFileChange
                                }
                            />

                            <label htmlFor="bulk-student-csv">
                                <Button
                                    component="span"
                                    variant="contained"
                                    startIcon={
                                        <UploadFileIcon />
                                    }
                                    disabled={
                                        isLoading
                                    }
                                    sx={{
                                        backgroundColor:
                                            "#2E7D32",
                                        "&:hover":
                                            {
                                                backgroundColor:
                                                    "#1B5E20",
                                            },
                                    }}
                                >
                                    Choose CSV File
                                </Button>
                            </label>

                            {fileName && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        mt: 1,
                                    }}
                                >
                                    Selected file:{" "}
                                    <strong>
                                        {
                                            fileName
                                        }
                                    </strong>
                                </Typography>
                            )}
                        </Box>

                        {/* Preview */}

                        {students.length >
                            0 && (
                            <Box>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight:
                                            "bold",
                                        mb: 1,
                                    }}
                                >
                                    Preview —{" "}
                                    {
                                        students.length
                                    }{" "}
                                    students
                                </Typography>

                                <TableContainer
                                    component={
                                        Paper
                                    }
                                    sx={{
                                        maxHeight:
                                            300,
                                    }}
                                >
                                    <Table
                                        stickyHeader
                                        size="small"
                                    >
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <strong>
                                                        Name
                                                    </strong>
                                                </TableCell>

                                                <TableCell>
                                                    <strong>
                                                        Username
                                                    </strong>
                                                </TableCell>

                                                <TableCell>
                                                    <strong>
                                                        Class
                                                    </strong>
                                                </TableCell>

                                                <TableCell>
                                                    <strong>
                                                        Section
                                                    </strong>
                                                </TableCell>

                                                <TableCell>
                                                    <strong>
                                                        Age
                                                    </strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {students
                                                .slice(
                                                    0,
                                                    10
                                                )
                                                .map(
                                                    (
                                                        student,
                                                        index
                                                    ) => (
                                                        <TableRow
                                                            key={
                                                                index
                                                            }
                                                        >
                                                            <TableCell>
                                                                {
                                                                    student.name
                                                                }
                                                            </TableCell>

                                                            <TableCell>
                                                                {
                                                                    student.username
                                                                }
                                                            </TableCell>

                                                            <TableCell>
                                                                {
                                                                    student.studentClass
                                                                }
                                                            </TableCell>

                                                            <TableCell>
                                                                {
                                                                    student.section
                                                                }
                                                            </TableCell>

                                                            <TableCell>
                                                                {
                                                                    student.age
                                                                }
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {students.length >
                                    10 && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 1,
                                        }}
                                    >
                                        Showing first
                                        10 of{" "}
                                        {
                                            students.length
                                        }{" "}
                                        students.
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {/* Selected batch */}

                        {selectedBatch &&
                            students.length >
                                0 && (
                                <Alert
                                    severity="success"
                                    sx={{
                                        mt: 3,
                                    }}
                                >
                                    {
                                        students.length
                                    }{" "}
                                    students will
                                    be added to the
                                    selected batch.
                                </Alert>
                            )}
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{ p: 3 }}
                >
                    <Button
                        onClick={handleClose}
                        disabled={
                            isLoading
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={
                            handleBulkSubmit
                        }
                        disabled={
                            isLoading ||
                            !selectedBatch ||
                            students.length ===
                                0
                        }
                        sx={{
                            backgroundColor:
                                "#2E7D32",
                            "&:hover": {
                                backgroundColor:
                                    "#1B5E20",
                            },
                        }}
                    >
                        {isLoading ? (
                            <>
                                <CircularProgress
                                    size={20}
                                    sx={{
                                        mr: 1,
                                        color: "white",
                                    }}
                                />

                                Uploading...
                            </>
                        ) : (
                            `Add ${
                                students.length ||
                                ""
                            } Student${
                                students.length ===
                                1
                                    ? ""
                                    : "s"
                            }`
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={
                    handleSnackbarClose
                }
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
            >
                <Alert
                    onClose={
                        handleSnackbarClose
                    }
                    severity={
                        snackbarSeverity
                    }
                    sx={{
                        width: "100%",
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default BulkStudentModal;