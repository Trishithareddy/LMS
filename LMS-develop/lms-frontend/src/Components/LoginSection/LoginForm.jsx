import { useEffect, useState } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import logo from "../../assets/superteacher-logo.png";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
    CircularProgress,
    Typography,
} from "@mui/material";
import "./login.css";

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const roles = [
        { key: "student", label: "Student" },
        { key: "teacher", label: "Teacher" },
        { key: "school-admin", label: "School Admin" },
    ];


    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("student");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation()


    useEffect(() => {
        if (location.pathname === "/super-admin") {
            setIsAdmin(true);
        }
    }, [])

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
            navigate(`/${userType}-dashboard`);
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

    return (
        <div className="w-full max-w-md p-2">
            {/* Logo */}
            <div className="text-center mb-6">
                <img
                    src={logo}
                    alt="SuperTeacher - Creating Creators"
                    className="h-20 w-auto mx-auto mb-4"
                />
                <h1 className="text-xl font-display font-bold text-foreground">
                    Welcome Back!
                </h1>
                <p className="text-muted-foreground mt-2">Sign in to continue learning</p>
            </div>

            {/* Role Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                {
                    isAdmin ?
                        (
                            <>
                                <button
                                    onClick={() => setUserType("admin")}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer duration-300 ${userType === "admin"
                                        ? "bg-card text-foreground shadow-lg"
                                        : "text-muted-foreground hover:text-foreground "
                                        }`}
                                >
                                    {"Super Admin"}
                                </button>
                            </>) : (<>
                                {roles.map((r) => (
                                    <button
                                        key={r.key}
                                        onClick={() => setUserType(r.key)}
                                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium  cursor-pointer transition-all duration-300 ${userType === r.key
                                            ? "bg-card text-foreground shadow-lg"
                                            : "text-muted-foreground hover:text-foreground "
                                            }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </>)
                }

            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="username" className="text-foreground font-medium">
                        Username
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-10 h-12 w-full bg-gray-100  rounded-xl border-none transition-all outline-green-700"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-foreground font-medium">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-12 w-full bg-gray-100 border-none rounded-xl transition-all mb-2 cursor-pointer outline-green-700"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors "
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {error && (
                    <Typography
                        color="error"
                        variant="body2"
                        align="center"
                        gutterBottom
                    >
                        {error}
                    </Typography>
                )}
                {success && (
                    <Typography
                        color="success"
                        variant="body2"
                        align="center"
                        gutterBottom
                    >
                        {success}
                    </Typography>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                    {isLoading ? <CircularProgress size={24} /> : "Sign In"}
                </button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-muted-foreground mt-4">
                © 2025 SuperTeacher. All rights reserved.
            </p>
        </div>
    );
};

export default LoginForm;
