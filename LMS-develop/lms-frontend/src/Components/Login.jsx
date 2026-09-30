import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { width } from "@mui/system";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import image_for_login from "../assets/image_for_login.png";
import we_learn from "../assets/we_learn.png";
import we_teach from "../assets/we_teach.png";
import We_suceed from "../assets/We_suceed.png";
import { ThemeProvider, createTheme } from "@mui/material/styles";




const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loginTheme = createTheme({
    palette: {
      mode: "light",
    },
  });

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

    const apiEndpoint = `${import.meta.env.VITE_API_URL}/${userType}/login`;

    try {
      const response = await axios.post(apiEndpoint, {
        username,
        password,
      });
      setSuccess(response.data.message);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userRole", userType); // Store the user role
      setUsername("");
      setPassword("");
      window.location.replace(`/${userType}-dashboard`);
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        setError(
          error.response.data.message ||
          "An error occurred during login"
        );
      } else if (error.request) {
        setError(
          "No response received from the server. Please try again."
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserTypeChange = (event, newUserType) => {
    if (newUserType !== null) {
      setUserType(newUserType);
    }
  };
  const images = [

    // image_for_login,
    we_learn,
    we_teach,
    We_suceed,
  ];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider theme={loginTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          overflowX: "hidden",
          overflowY: "auto",
          background: "linear-gradient(135deg,#EEF4FF,#F8FBFF)",
        }}
      >
        <div className="flex justify-between items-start">



        </div>
        {/* Top Left Logo */}
        <Box
          sx={{
            flex: 1.6,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            px: { xs: 2, md: 5 },
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
                fontSize: 46,
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
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              px: { xs: 2, md: 5 },
              py: 2,
            }}
          >
            {/* Image */}
            <Box
              component="img"
              key={currentImage}
              src={images[currentImage]}
              alt="SuperTeacher"
              sx={{
                width: {
                  xs: "100%",
                  sm: "95%",
                  md: "92%",
                },
                height: "auto",
                maxWidth: 900,
                maxHeight: {
                  xs: 280,
                  sm: 360,
                  md: "70vh",
                },
                objectFit: "contain",
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
        {/* RIGHT SIDE */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: { xs: 2, md: 4 }
          }}
        >

          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: {
                  xs: "100%",
                  sm: 430,
                },
                p: {
                  xs: 3,
                  md: 5,
                },
                borderRadius: 4,
                bgcolor: "#fff",
                border: "1px solid #E5E7EB",
                boxShadow: "0 15px 40px rgba(0,0,0,.08)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 4,
                }}
              >
                <Box
                  component="img"
                  src="/SuperTeacher_Logo_new_2.png"
                  alt="Logo"
                  sx={{
                    height: 58,
                    mb: 2,
                  }}
                />


                <Typography
                  sx={{
                    mt: 1.2,
                    fontSize: 16,
                    color: "#6B7280",
                    fontWeight: 700,
                    letterSpacing: ".2px",
                  }}
                >
                  Sign in to continue your learning journey
                </Typography>
              </Box>

              <ToggleButtonGroup
                value={userType}
                exclusive
                onChange={handleUserTypeChange}
                fullWidth
                sx={{
                  mb: 3,

                  "& .MuiToggleButton-root": {
                    py: 1,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: 12,
                  },

                  "& .Mui-selected": {
                    bgcolor: "#43A047 !important",
                    color: "#fff",
                  },
                }}
              >
                <ToggleButton value="student">Student</ToggleButton>
                <ToggleButton value="teacher">Teacher</ToggleButton>
                <ToggleButton value="school-admin">
                  School Admin
                </ToggleButton>
              </ToggleButtonGroup>

              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Username"
                  value={username}
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2
                    }
                  }}
                  onChange={(e) => setUsername(e.target.value)}
                />

                <TextField
                  fullWidth
                  margin="normal"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  variant="outlined"
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Typography color="error" mt={1}>
                    {error}
                  </Typography>
                )}

                {success && (
                  <Typography color="success.main" mt={1}>
                    {success}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 1
                  }}
                >
                  {/* <Button
                    variant="text"
                    size="small"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      color: "#1976d2",
                      p: 0,
                      minWidth: "auto"
                    }}
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot Password?
                  </Button> */}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: 1.5,
                    bgcolor: "#43A047",
                    "&:hover": {
                      bgcolor: "#2E7D32",
                    },
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "SIGN IN"
                  )}
                </Button>
              </form>

              <Typography
                align="center"
                sx={{
                  mt: 4,
                  color: "#777",
                  fontSize: 13
                }}
              >
                © {new Date().getFullYear()} SuperTeacher • All Rights Reserved
              </Typography>
            </Paper>
          </Box>


        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
