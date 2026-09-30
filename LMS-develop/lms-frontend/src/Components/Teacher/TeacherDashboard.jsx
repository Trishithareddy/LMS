import { Box, Grid, useTheme } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BreadcrumbContext } from "../BreadcrumbContext";
import TeacherFooter from "./TeacherComponents/TeacherFooter";
import TeacherHeader from "./TeacherComponents/TeacherHeader";
import TeacherSidebar from "./TeacherComponents/TeacherSidebar";

const TeacherDashboard = () => {
  const { setBreadcrumbTrail } = useContext(BreadcrumbContext);
  const location = useLocation();
  const theme = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const studentName = '';

  useEffect(() => {
    // This will run when the location changes
    if (location.pathname === '/teacher-dashboard') {
      setBreadcrumbTrail([
        { name: 'Teacher Dashboard', path: '/teacher-dashboard' },
      ]);
    }
  }, [location.pathname]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        transition: "all .3s ease",
      }}
    >
      <Box>
        <TeacherHeader
          handleSidebarToggle={handleSidebarToggle}
          handleLogout={handleLogout}
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
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          }}
        >
          <TeacherSidebar />
        </Grid>
        <Grid
          item
          xs={12}
          md={sidebarOpen ? 10 : 12}
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            transition: "width 0.3s ease",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <Outlet context={{ studentName }} />
        </Grid>
      </Grid>

      <Box
        sx={{
          position: "relative",
        }}
      >
        <TeacherFooter />
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
