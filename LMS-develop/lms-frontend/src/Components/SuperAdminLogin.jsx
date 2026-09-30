import {
    Box,
    Button,
    CircularProgress,
    Container,
    Paper,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import { width } from "@mui/system";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import we_learn from "../assets/We_learn.png";
import we_teach from "../assets/We_teach.png";
import we_succeed from "../assets/We_suceed.png";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const userType = "admin";
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        if (!username || !password) {
            setError("Username and password are required");
            setIsLoading(false);
            return;
        }

        const apiEndpoint =
            `${import.meta.env.VITE_API_URL}/admin/login`;

        try {
            const response = await axios.post(apiEndpoint, { username, password });
            setSuccess(response.data.message);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("userRole", userType); // Store the user role
            setUsername("");
            setPassword("");
            navigate("/admin-dashboard");
        } catch (error) {
            console.error("Login error:", error);
            if (error.response) {
                setError(error.response.data.message || "An error occurred during login");
            } else if (error.request) {
                setError("No response received from the server. Please try again.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const images = [


        we_learn,
        we_teach,
        we_succeed,
    ];

    const [currentImage, setCurrentImage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 4000);

        return () => clearInterval(interval);
    }, []);



    return (
        <Box
            sx={{
                height: "105vh",
                display: "flex",
                overflow: "hidden",
                background: "linear-gradient(135deg,#EEF4FF,#F8FBFF)",
            }}
        >
            {/* ================= LEFT HERO ================= */}

            <Box
                sx={{
                    flex: 1.6,
                    display: { xs: "none", md: "flex" },
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    px: 5,
                    py: 2,
                }}
            >
                <Box
                    sx={{
                        width: "100%",
                        mb: 2,
                    }}
                >
                    <img
                        src="/SuperTeacher_Logo_new_2.png"
                        alt="logo"
                        style={{ height: 55 }}
                    />
                </Box>

                <Box
                    sx={{
                        width: "100%",
                        maxWidth: 850,
                        mb: 2,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 38,
                            fontWeight: 800,
                            color: "#1B2559",
                            lineHeight: 1.1,
                        }}
                    >
                        Welcome to{" "}
                        <Box
                            component="span"
                            sx={{
                                color: "#E65100",   // Orange like the logo
                                fontWeight: 900,
                            }}
                        >
                            Super
                        </Box>

                        <Box
                            component="span"
                            sx={{
                                color: "#2962FF",   // Blue like the logo
                                fontWeight: 900,
                            }}
                        >
                            Teacher
                        </Box>

                    </Typography>



                    <Typography
                        sx={{
                            mt: 1,
                            fontSize: 24,
                            color: "#5B6475",
                        }}
                    >
                        Empowering education. Inspiring futures.
                    </Typography>
                </Box>

                {/* LEFT SIDE */}
                <Box
                    sx={{
                        flex: 1.6,
                        display: { xs: "none", md: "flex" },
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                        p: 4,
                    }}
                >
                    {/* Image */}
                    <Box
                        component="img"
                        key={currentImage}
                        src={images[currentImage]}
                        alt="SuperTeacher"
                        sx={{
                            width: "92%",
                            maxWidth: 900,
                            maxHeight: "70vh",
                            objectFit: "cover",

                            borderRadius: "28px",

                            overflow: "hidden",

                            boxShadow: "0 18px 45px rgba(0,0,0,.12)",



                            animation: "fadeImage 1s ease-in-out",

                            "@keyframes fadeImage": {
                                from: {
                                    opacity: 0,
                                    transform: "translateY(15px) scale(0.88)",
                                },
                                to: {
                                    opacity: 1,
                                    transform: "translateY(0px) scale(1)",
                                },
                            },
                        }}
                    />
                    {/* Dots */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 35,
                            left: "50%",
                            transform: "translateX(-50%)",
                            display: "flex",
                            gap: 1,
                        }}
                    >
                        {images.map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: currentImage === index ? "#1976d2" : "#C5D3E8",
                                    transition: ".3s",
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>
            {/* ================= RIGHT LOGIN ================= */}

            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    p: 5,
                }}
            >
                <Paper
                    elevation={10}
                    sx={{
                        width: "100%",
                        maxWidth: 470,
                        p: 5,
                        borderRadius: 5,
                    }}
                >
                    <Box textAlign="center" mb={4}>
                        <img
                            src="/SuperTeacher_Logo_new_2.png"
                            alt="logo"
                            style={{ height: 65 }}
                        />

                        <Typography
                            variant="h4"
                            fontWeight={700}
                            mt={3}
                        >
                            Welcome Back
                        </Typography>

                        <Typography
                            color="text.secondary"
                            mt={1}
                        >
                            Super Admin Portal
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            bgcolor: "#E8F5E9",
                            border: "1px solid #4CAF50",
                            borderRadius: 3,
                            py: 1.3,
                            mb: 3,
                            textAlign: "center",
                        }}
                    >
                        <Typography
                            sx={{
                                color: "#2E7D32",
                                fontWeight: 700,
                                letterSpacing: 1,
                            }}
                        >
                            SUPER ADMIN
                        </Typography>
                    </Box>

                    <form onSubmit={handleLogin}>

                        <TextField
                            fullWidth
                            label="Username"
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && (
                            <Typography
                                color="error"
                                mt={2}
                            >
                                {error}
                            </Typography>
                        )}

                        {success && (
                            <Typography
                                color="success.main"
                                mt={2}
                            >
                                {success}
                            </Typography>
                        )}

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            disabled={isLoading}
                            sx={{
                                mt: 4,
                                py: 1.7,
                                borderRadius: 3,
                                fontWeight: 700,
                                fontSize: 16,
                                background:
                                    "linear-gradient(90deg,#43A047,#2E7D32)",

                                "&:hover": {
                                    background:
                                        "linear-gradient(90deg,#2E7D32,#1B5E20)",
                                },
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress
                                    size={24}
                                    color="inherit"
                                />
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <Typography
                        align="center"
                        mt={4}
                        color="text.secondary"
                    >
                        © {new Date().getFullYear()} SuperTeacher
                    </Typography>

                </Paper>
            </Box>
        </Box>
    );
};

export default Login;