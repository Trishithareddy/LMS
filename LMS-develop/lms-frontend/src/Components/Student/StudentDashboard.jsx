import { Box, Grid, Typography } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import StudentFooter from "./StudentComponents/StudentFooter";
import StudentHeader from "./StudentComponents/StudentHeader";
import StudentSidebar from "./StudentComponents/StudentSidebar";
import StudentAutoAttendance from "./StudentComponents/StudentAutoAttendance";

const StudentDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [studentName, setStudentName] = useState("");
    const [schoolImageUrl, setSchoolImageUrl] = useState("");

    const navigate = useNavigate();

    const handleSidebarToggle = () => {
        if (window.innerWidth <= 768) {
            if (window.scrollY !== 0) {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setSidebarOpen(true);
            } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setSidebarOpen(!sidebarOpen);
            }
        } else {
            setSidebarOpen(!sidebarOpen);
        }
    };

    const handleLogout = () => {
        Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith("attendance_marked_")) {
                sessionStorage.removeItem(key);
            }
        });
        localStorage.removeItem("token");
        navigate("/");
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/student/profile`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                setData(response.data.student);
                setStudentName(response.data.student.name || "");
                setSchoolImageUrl(response.data.student.school?.imageUrl || "");
            } catch (err) {
                setError(err.message);
            }
        };

        fetchdata();
    }, []);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
            }}
        >
            <StudentAutoAttendance student={data} />

            <Box>
                <StudentHeader
                    handleSidebarToggle={handleSidebarToggle}
                    handleLogout={handleLogout}
                    studentName={studentName}
                    schoolImageUrl={schoolImageUrl}
                />
            </Box>

            <Grid container sx={{ flex: { xs: "none", md: 1 } }}>
                <Grid
                    item
                    xs={12}
                    md={2}
                    sx={{
                        display: sidebarOpen ? "flex" : "none",
                        flexDirection: "column",
                        transition: "all 0.3s ease",
                        opacity: sidebarOpen ? 1 : 0,
                        width: sidebarOpen ? "auto" : 0,
                        bgcolor: "background.paper",
                        borderRight: 1,
                        borderColor: "divider",
                    }}
                >
                    <StudentSidebar />
                </Grid>

                <Grid
                    item
                    xs={12}
                    md={sidebarOpen ? 10 : 12}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        bgcolor: "background.default",
                        transition: "width 0.3s ease",
                    }}
                >
                    {error ? (
                        <Typography>Error: {error}</Typography>
                    ) : (
                        <Outlet context={{ data, studentName }} />
                    )}
                </Grid>
            </Grid>

            <Box sx={{ mt: "auto" }}>
                <StudentFooter />
            </Box>
        </Box>
    );
};

export default StudentDashboard;
