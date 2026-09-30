import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import { useNavigate } from "react-router-dom";

const settings = ["Profile", "Account", "Dashboard", "Logout"];

function TerminalHeader({ terminalName }) {
    const [anchorElUser, setAnchorElUser] = React.useState(null);

    const navigate = useNavigate();
    const role =
        localStorage.getItem("userRole") ||
        localStorage.getItem("role") ||
        localStorage.getItem("userType");
    const dashboardPath =
        role === "teacher"
            ? "/teacher-dashboard"
            : role === "student"
              ? "/student-dashboard"
              : role === "admin"
                ? "/admin-dashboard"
                : "/";

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

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
                sx={{
                    backgroundColor: "rgba(224, 224, 224, 0.7)",
                    backdropFilter: "blur(5px)",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                    transition: "top 0.3s ease",
                    width: "100%",
                    zIndex: 1100,
                }}
            >
                <Container
                    maxWidth={false}
                    sx={{ paddingLeft: 0, paddingRight: 0 }}
                >
                    <Toolbar disableGutters>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                flexGrow: 1,
                            }}
                        >
                            <Button
                                startIcon={<ArrowBackRoundedIcon />}
                                onClick={() => navigate(dashboardPath)}
                                sx={{
                                    mr: 1,
                                    minWidth: "unset",
                                    color: "#14532d",
                                    textTransform: "none",
                                    fontWeight: 700,
                                }}
                            >
                                Dashboard
                            </Button>
                            <img
                                src="/SuperTeacher_Logo_new_2.png"
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
                                    color: "#07752A",
                                    flexGrow: 1,
                                    textAlign: "center",
                                    // display: { xs: "none", sm: "block" },
                                }}
                            >
                                {terminalName}
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {/* <img
                                src="https://upload.wikimedia.org/wikipedia/en/4/44/Ryan_International_Group_logo.png"
                                alt="School Logo"
                                style={{
                                    height: "40px",
                                    width: "auto",
                                    marginRight: "16px",
                                }}
                            /> */}
                            <Tooltip title="Open settings">
                                <IconButton
                                    onClick={handleOpenUserMenu}
                                    sx={{ p: 0 }}
                                >
                                    <Avatar
                                        alt="S"
                                        src="/static/images/avatar/2.jpg"
                                    />
                                </IconButton>
                            </Tooltip>
                            <Menu
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
                </Container>
            </AppBar>

            {/* Ensure content doesn't hide behind the header */}
            <Box sx={{ marginTop: "64px" }}>{/* Page content goes here */}</Box>
        </>
    );
}

export default TerminalHeader;
