import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Grid,
    Avatar,
    Divider,
    Switch,
    Alert,
    IconButton,
    InputAdornment,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import {
    AccountCircle,
    Save,
    Notifications,
    Security,
    Email,
} from "@mui/icons-material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

// const data = {
//     name: "John Admin",
//     email: "john.admin@school.edu",
//     phone: "+1 (555) 123-4567",
//     role: "Administrator",
//     department: "Administration",
// };
const ProfileSettings = ({ schoolAdmin, onSave }) => {
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        status: "active",
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [showSuccess, setShowSuccess] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    React.useEffect(() => {
        if (schoolAdmin) {
            setFormData(schoolAdmin);
        } else {
            setFormData({
                name: "",
                username: "",
                status: "active",
            });
        }
        setPasswordData({
            newPassword: "",
            confirmPassword: "",
        });
        setPasswordError("");
    }, [schoolAdmin]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData((prev) => ({ ...prev, [field]: value }));
        setPasswordError("");
    };

    const validatePassword = () => {
        if (passwordData.newPassword.length < 0) {
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
        }
        return true;
    };

    const handleSave = () => {
        if (formData.name && formData.username) {
            if (validatePassword()) {
                const adminData = { ...formData };

                adminData.password = passwordData.newPassword;

                
                onSave(adminData);
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ fontWeight: "bold", mb: 3 }}
            >
                Profile Settings
            </Typography>

            {showSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Profile settings updated successfully!
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent sx={{ textAlign: "center", p: 4 }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    mx: "auto",
                                    mb: 2,
                                    backgroundColor: "#2E7D32",
                                    fontSize: 48,
                                }}
                            >
                                <AccountCircle sx={{ fontSize: 80 }} />
                            </Avatar>
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{ fontWeight: "bold" }}
                            >
                                {schoolAdmin.name}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                                gutterBottom
                            >
                                Administrator
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Administration
                            </Typography>
                            <Button
                                variant="outlined"
                                sx={{
                                    mt: 2,
                                    borderColor: "#2E7D32",
                                    color: "#2E7D32",
                                    "&:hover": {
                                        borderColor: "#2E7D32",
                                        backgroundColor: "#E8F5E8",
                                    },
                                }}
                            >
                                Change Photo
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card elevation={2}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{ fontWeight: "bold", mb: 3 }}
                            >
                                Personal Information
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={formData.name || ""}
                                        onChange={(e) =>
                                            handleChange("name", e.target.value)
                                        }
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Username"
                                        value={formData.username || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "username",
                                                e.target.value
                                            )
                                        }
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
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
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Confirm New Password"
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

                            <Divider sx={{ my: 4 }} />

                            <Box
                                sx={{
                                    mt: 4,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <Button
                                    variant="contained"
                                    startIcon={<Save />}
                                    onClick={handleSave}
                                    sx={{
                                        backgroundColor: "#2E7D32",
                                        "&:hover": {
                                            backgroundColor: "#1B5E20",
                                        },
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProfileSettings;
