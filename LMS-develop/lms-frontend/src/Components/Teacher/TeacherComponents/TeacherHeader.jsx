import MenuIcon from "@mui/icons-material/Menu"; // Import MenuIcon for the hamburger icon
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
// import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import axios from "axios";
import * as React from "react";
import { useEffect, useState, useContext } from "react";
import BreadcrumbsComponent from "../../BreadcrumbsComponent";
import { Box, Grid, useTheme } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { ThemeContext } from "../../../contexts/ThemeContext";

const settings = ["Dashboard", "Logout"];

function TeacherHeader({ handleSidebarToggle, handleLogout }) {
    const [anchorElUser, setAnchorElUser] = React.useState(null);
    const [showHeader, setShowHeader] = React.useState(true);
    const [lastScrollPosition, setLastScrollPosition] = useState(0);
    const [teacherName, setTeacherName] = useState("");
    const [schoolImageUrl, setSchoolImageUrl] = useState("");
    const theme = useTheme();
    const { mode, toggleTheme } = useContext(ThemeContext);
    const logoPath = "/SuperTeacher_Logo_new_2.png"

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/teacher/getLoggedinTeacher`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                setTeacherName(response.data.teacher.name);
                setSchoolImageUrl(response.data.teacher.school.imageUrl)

            } catch (error) {
                console.error("Error fetching batches:", error);
            }
        };

        fetchBatches();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPosition = window.pageYOffset;
            if (window.scrollY >= 0 && window.scrollY <= 85) {
                setShowHeader(true);
            } else if (window.scrollY > 200) {
                let timer = setTimeout(() => {
                    setShowHeader(true);
                    // setPosition("fixed")
                    // setMarginForTop("85px")
                }, 500);
                // When scroll exceeds 200px, trigger header to show
            } else if (currentScrollPosition > lastScrollPosition) {

                setShowHeader(false); // Hide header when scrolling back up
            }
            setLastScrollPosition(currentScrollPosition);
        };

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [lastScrollPosition]);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleProfile = () => {
        console.log("profile clicked");
    };

    const handleMenuItemClick = (setting) => {
        if (setting === "Logout") {
            handleLogout();
        } else if (setting === "Profile") {
            handleProfile();
        }

        handleCloseUserMenu();
    };

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backgroundColor:
                        theme.palette.mode === "dark"
                            ? "rgba(18,18,18,0.85)"
                            : "rgba(255,255,255,0.82)",

                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",

                    borderBottom: `1px solid ${theme.palette.divider}`,

                    boxShadow:
                        theme.palette.mode === "dark"
                            ? "0 8px 24px rgba(0,0,0,.45)"
                            : "0 8px 24px rgba(0,0,0,.08)",

                    color: theme.palette.text.primary,

                    top: showHeader ? 0 : "-100px",
                    transition: "all .35s ease",
                    width: "100%",
                    zIndex: theme.zIndex.drawer + 1,
                }}
            >
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <IconButton
                            onClick={handleSidebarToggle}
                            sx={{
                                mr: 2,
                                color: theme.palette.text.primary,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Logo and middle text on the left */}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                flexGrow: 1,
                            }}
                        >
                            <img
                                src={logoPath}
                                alt="Logo"
                                style={{
                                    height: "40px",
                                    width: "auto",
                                    marginRight: "16px",
                                }}
                            />

                            <Typography
                                variant="h6"
                                noWrap
                                component="div"
                                sx={{
                                    color: theme.palette.primary.main,
                                    flexGrow: 1,
                                    textAlign: "center",
                                    display: { xs: "none", sm: "block" },
                                    fontWeight: 700,
                                }}
                            >
                                {teacherName}
                            </Typography>
                        </Box>

                        {/* School logo and profile icon on the right */}
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <IconButton
                                onClick={toggleTheme}
                                sx={{
                                    mr: 2,
                                    color: "text.primary",
                                }}
                            >
                                {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
                            </IconButton>

                            <img
                                src={schoolImageUrl || logoPath}
                                alt="School Logo"
                                style={{
                                    height: "40px",
                                    width: "auto",
                                    marginRight: "16px",
                                }}
                            />
                            <Tooltip title="Open settings">
                                <IconButton
                                    onClick={handleOpenUserMenu}
                                    sx={{ p: 0 }}
                                >
                                    <Avatar
                                        alt={teacherName}
                                        src="/static/images/avatar/2.jpg"
                                        sx={{
                                            bgcolor: theme.palette.primary.main,
                                            color: theme.palette.primary.contrastText,
                                            border: `2px solid ${theme.palette.divider}`,
                                        }}
                                    />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                PaperProps={{
                                    sx: {
                                        bgcolor: theme.palette.background.paper,
                                        color: theme.palette.text.primary,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        minWidth: 170,
                                    },
                                }}
                                sx={{ mt: "45px" }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >
                                {settings.map((setting) => (
                                    <MenuItem
                                        sx={{
                                            "&:hover": {
                                                bgcolor: theme.palette.action.hover,
                                            },
                                        }}
                                        key={setting}
                                        onClick={() =>
                                            handleMenuItemClick(setting)
                                        }
                                    >
                                        <Typography textAlign="center">
                                            {setting}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </Toolbar>
                    <Box
                        sx={{
                            py: 0.75,
                            display: "flex",
                            justifyContent: "center",
                            borderTop: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <BreadcrumbsComponent />
                    </Box>
                </Container>
            </AppBar>
            <Box sx={{ marginTop: "100px" }}></Box>
        </>
    );
}

export default TeacherHeader;
