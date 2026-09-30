import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Box,
    Typography,
    IconButton,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
const StudentModal = ({
    open,
    student,
    onClose,
    getbatches,
    getSchool,
    fetchData,
}) => {

    console.log("Student data in modal:", student);
    console.log("Batches data in modal:", getbatches);
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        contact: "NA",
        studentClass: "",
        section: "",
        age: undefined,
        fatherName: "N/A",
        address: "",
        batchId: undefined,
    });
    const [selectedBatch, setSelectedBatch] = useState("");
    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [isLoading, setIsLoading] = useState(false);

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    React.useEffect(() => {

        if (student) {

            setFormData({
                name: student.name || "",
                username: student.username || "",
                studentClass: student.class || "",
                section: student.section || "",
                age: student.age || undefined,
                fatherName: student.fatherName || "",
                address: student.address || "",
            });
            const existingBatch = Array.isArray(student.batches)
                ? student.batches[0]
                : student.batches;
            setSelectedBatch(existingBatch?._id || existingBatch || "");
        } else {
            setFormData({
                name: "",
                username: "",
                contact: "NA",
                studentClass: "",
                section: "",
                age: undefined,
                fatherName: "NA",
                address: "",
            });
            setSelectedBatch("");

        }
        setPasswordData({
            newPassword: "",
            confirmPassword: "",
        });
        setPasswordError("");
    }, [student]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData((prev) => ({ ...prev, [field]: value }));
        setPasswordError("");
    };

    const validatePassword = () => {
        if (!passwordData.newPassword) {
            setPasswordError("New password is required");
            return false;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters long");
            return false;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSubmit = () => {
        const isNewStudent = !student;

        if (
            (isNewStudent && validatePassword()) ||
            (!isNewStudent &&
                (passwordData.newPassword === "" || validatePassword()))
        ) {
            const studentData = { ...formData };

            // Only send password if user entered it
            if (passwordData.newPassword) {
                studentData.password = passwordData.newPassword;
            }
            if (selectedBatch) {
                studentData.batchId = [selectedBatch];
            }
            studentData.schoolId = getSchool._id;



            if (student) {
                handleStudentUpdate(student._id, studentData);
            } else {
                handleStudentSave(studentData);
            }

            onClose();
            setSelectedBatch("");
        }
    };

    const handleStudentSave = async (studentData) => {
        const token = localStorage.getItem("token");
        try {
            console.log("Saving student with data:", studentData);
            setIsLoading(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/admin/student/create`,
                { students: [studentData] },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSnackbarMessage("Student added successfully");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);
            fetchData();
        } catch (error) {
            console.error("Error unable to add Student:", error);
            setSnackbarMessage("Someting went wrong, unable to add student");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentUpdate = async (studentId, studentData) => {
        setIsLoading(true);


        const token = localStorage.getItem("token");
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL
                }/school-admin/student/update/${studentId}`,
                studentData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage("Student updated successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                fetchData();
            }
        } catch (error) {
            console.error("Error unable to update:", error);
            setSnackbarMessage("Someting went wrong, unable to update student");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>

            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        {student ? "Edit Student" : "Add Student"}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Full Name"
                                    value={formData.name || ""}
                                    onChange={(e) =>
                                        handleChange("name", e.target.value)
                                    }
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Username"
                                    required
                                    type="email"
                                    value={formData.username || ""}
                                    onChange={(e) =>
                                        handleChange("username", e.target.value)
                                    }
                                    variant="outlined"
                                />
                            </Grid>
                            {/* <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Phone Number"
                                    value={formData.contact || ""}
                                    onChange={(e) =>
                                        handleChange("contact", e.target.value)
                                    }
                                    variant="outlined"
                                />
                            </Grid> */}
                            {/* <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Father Name"
                                    value={formData.fatherName || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            "fatherName",
                                            e.target.value
                                        )
                                    }
                                    variant="outlined"
                                />
                            </Grid> */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Address"
                                    value={formData.address || ""}
                                    onChange={(e) =>
                                        handleChange("address", e.target.value)
                                    }
                                    variant="outlined"
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="Class"
                                    required
                                    value={formData.studentClass || ""}
                                    onChange={(e) =>
                                        handleChange(
                                            "studentClass",
                                            e.target.value
                                        )
                                    }
                                    variant="outlined"
                                    placeholder="1st, 2nd, 3rd, 4th etc."
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="Section"
                                    required
                                    value={formData.section || ""}
                                    onChange={(e) =>
                                        handleChange("section", e.target.value)
                                    }
                                    variant="outlined"
                                    placeholder="A, B, C etc."
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Age"
                                    required
                                    value={formData.age || null}
                                    onChange={(e) =>
                                        handleChange(
                                            "age",
                                            Number(e.target.value)
                                        )
                                    }
                                    variant="outlined"
                                    placeholder="12, 13 etc."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel id="select-batch-label">
                                        Batch
                                    </InputLabel>
                                    <Select
                                        labelId="select-batch-label"
                                        id="simple-select"
                                        value={selectedBatch || ""}
                                        label="Batch"
                                        onChange={(e) =>
                                            setSelectedBatch(e.target.value)
                                        }
                                    >
                                        {getbatches.map((batch) => (
                                            <MenuItem
                                                key={batch._id}
                                                value={batch._id}
                                            >
                                                {batch.batchName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label={student ? "Reset Password (optional)" : "New Password"}
                                    required={!student}
                                    helperText={
                                        student
                                            ? "Leave blank to keep the current password."
                                            : ""
                                    }
                                    type={showPassword ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        handlePasswordChange(
                                            "newPassword",
                                            e.target.value
                                        )
                                    }
                                    variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() =>
                                                        setShowPassword(
                                                            !showPassword
                                                        )
                                                    }
                                                    edge="end"
                                                >
                                                    {showPassword ? (
                                                        <VisibilityOff />
                                                    ) : (
                                                        <Visibility />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    required={!student}
                                    label={
                                        student
                                            ? "Confirm Reset Password"
                                            : "Confirm New Password"
                                    }
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        handlePasswordChange(
                                            "confirmPassword",
                                            e.target.value
                                        )
                                    }
                                    variant="outlined"
                                    error={!!passwordError}
                                    helperText={passwordError}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() =>
                                                        setShowConfirmPassword(
                                                            !showConfirmPassword
                                                        )
                                                    }
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? (
                                                        <VisibilityOff />
                                                    ) : (
                                                        <Visibility />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={onClose} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            backgroundColor: "#2E7D32",
                            "&:hover": {
                                backgroundColor: "#1B5E20",
                            },
                        }}
                    >
                        {student ? "Update" : "Add"} Student
                    </Button>
                </DialogActions>
            </Dialog>

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
    );
};

export default StudentModal;
