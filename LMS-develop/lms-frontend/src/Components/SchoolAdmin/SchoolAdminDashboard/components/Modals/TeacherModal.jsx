import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Divider,
    IconButton,
    InputAdornment,
    Chip,
    OutlinedInput,
    Snackbar,
    Alert,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";

const TeacherModal = ({
    open,
    teacher,
    onClose,
    getSchool,
    getbatches,
    fetchData,
}) => {
    // console.log("Teacher data :", teacher);
    // console.log("getBatches data :", getbatches);
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        batchId: null,
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [selectedBatch, setSelectedBatch] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [isLoading, setIsLoading] = useState(false);

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    React.useEffect(() => {
        if (teacher) {
            setFormData({
                name: teacher.name || "",
                username: teacher.username || "",
            });

            const existingBatches = Array.isArray(teacher.batches)
                ? teacher.batches.map((batch) => batch?._id || batch).filter(Boolean)
                : [];
            setSelectedBatch(existingBatches);
        } else {
            setFormData({
                name: "",
                username: "",
            });

            setSelectedBatch([]);
        }

        setPasswordData({
            newPassword: "",
            confirmPassword: "",
        });
        setPasswordError("");
    }, [teacher, getbatches]);
    const handleDelete = (batchIdToRemove) => {
        const updated = selectedBatch.filter(
            (id) => String(id) !== String(batchIdToRemove)
        );
        setSelectedBatch(updated);
    };

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
        const isNewTeacher = !teacher;
        if (
            (isNewTeacher && validatePassword()) ||
            (!isNewTeacher &&
                (passwordData.newPassword === "" || validatePassword()))
        ) {
            const teacherData = { ...formData };
            //only send password if user entered it
            if (passwordData.newPassword) {
                teacherData.password = passwordData.newPassword;
            }
            if (selectedBatch) {
                teacherData.batchId = selectedBatch;
            }
            teacherData.schoolId = getSchool._id;



            if (teacher) {
                handleTeacherUpdate(teacher._id, teacherData);
            } else {
                handleTeacherSave(teacherData);
            }
            onClose();
            setSelectedBatch([]);
        }
    };

    const handleTeacherSave = async (teacherData) => {
        const token = localStorage.getItem("token");
        try {
            setIsLoading(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/admin/teacher/create`,
                { teachers: [teacherData] },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage("Teacher created successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
            }
            fetchData();
        } catch (error) {
            console.error("Error creating teacher:", error);
            setSnackbarMessage("Unable to create teacher");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };
    const handleTeacherUpdate = async (teacherId, teacherData) => {

        const token = localStorage.getItem("token");
        try {
            setIsLoading(true);
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL
                }/school-admin/teacher/update/${teacherId}`,
                teacherData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setSnackbarMessage("Teacher updated successfully");
                setSnackbarSeverity("success");
                setOpenSnackbar(true);
                fetchData();
            }
        } catch (error) {
            console.error("Error updating teacher:", error);
            setSnackbarMessage("Unable to update teacher");
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
                        {teacher ? "Edit Teacher" : "Add Teacher"}
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
                                    required
                                    label="Email Address"
                                    type="email"
                                    value={formData.username || ""}
                                    onChange={(e) =>
                                        handleChange("username", e.target.value)
                                    }
                                    variant="outlined"
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
                                        multiple
                                        value={selectedBatch}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setSelectedBatch(
                                                typeof value === "string"
                                                    ? [value]
                                                    : value
                                            );
                                        }}
                                        input={<OutlinedInput label="Batch" />}
                                        renderValue={(selected) => (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: 0.5,
                                                }}
                                            >
                                                {selected.map((id) => {
                                                    const batch =
                                                        getbatches.find(
                                                            (b) =>
                                                                String(
                                                                    b._id
                                                                ) === String(id)
                                                        );
                                                    return (
                                                        <Chip
                                                            key={id}

                                                            label={
                                                                batch?.batchName ||
                                                                id
                                                            }
                                                            onMouseDown={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                            onDelete={() =>
                                                                handleDelete(id)
                                                            }
                                                            deleteIcon={
                                                                <CancelIcon
                                                                    sx={{
                                                                        fontSize: 18,
                                                                    }}
                                                                />
                                                            }
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
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

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required={!teacher}
                                    label={teacher ? "Reset Password (optional)" : "New Password"}
                                    helperText={
                                        teacher
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
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required={!teacher}
                                    label={
                                        teacher
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
                        {teacher ? "Update" : "Add"} Teacher
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

export default TeacherModal;
